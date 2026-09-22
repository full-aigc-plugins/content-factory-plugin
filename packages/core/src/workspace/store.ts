import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ContentFactoryError } from "../errors.ts";
import { acquireWorkspaceLease, type WorkspaceLease } from "./lease.ts";
import { migrateWorkspace } from "./migrations.ts";
import { writeObject, type ObjectRecord } from "./objects.ts";

export type PersistedObjectRecord = {
  sha256: string;
  relativePath: string;
  bytes: number;
};

export type PersistedSourceRecord = {
  sourceId: string;
  fileName: string;
  mediaType: string;
  rawSha256: string;
  textSha256: string;
  bytes: number;
  importedAt: string;
};

export type RevisionRecord = {
  revisionId: string;
  itemId: string;
  parentRevisionId: string | null;
  objectSha256: string;
  authorKind: string;
  createdAt: string;
};

export type RevisionCommitInput = RevisionRecord & {
  expectedRevisionId: string;
};

export type RevisionCommitResult = {
  status: "advanced" | "conflict";
  currentHeadRevisionId: string;
};

export type DeliverySubmissionRecord = {
  intentId: string;
  bundleHash: string;
  accountAlias: string;
  requestId: string;
  status: "prepared" | "submitting" | "failed" | "unknown" | "conflict" | "succeeded";
  remoteDraftId: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryAssetMapRecord = {
  intentId: string;
  artifactId: string;
  sha256: string;
  remoteAssetId: string;
  createdAt: string;
};

export class WorkspaceStore {
  readonly root: string;
  readonly stateDir: string;
  readonly objectsDir: string;
  readonly schemaVersion: number;
  readonly readOnly: boolean;

  #db: DatabaseSync;
  #lease: WorkspaceLease;
  #closed = false;

  constructor(input: {
    root: string;
    stateDir: string;
    objectsDir: string;
    db: DatabaseSync;
    lease: WorkspaceLease;
    schemaVersion: number;
    readOnly: boolean;
  }) {
    this.root = input.root;
    this.stateDir = input.stateDir;
    this.objectsDir = input.objectsDir;
    this.#db = input.db;
    this.#lease = input.lease;
    this.schemaVersion = input.schemaVersion;
    this.readOnly = input.readOnly;
  }

  #assertWritable(): void {
    if (this.readOnly) {
      throw new ContentFactoryError({
        code: "WORKSPACE_READ_ONLY_FUTURE_SCHEMA",
        message: `workspace schema ${this.schemaVersion} is newer than this runtime`,
        retryable: false,
        details: { schemaVersion: this.schemaVersion }
      });
    }
    if (this.#closed) {
      throw new ContentFactoryError({
        code: "WORKSPACE_CLOSED",
        message: "workspace store is closed",
        retryable: false
      });
    }
  }

  async putObject(bytes: Uint8Array): Promise<ObjectRecord> {
    this.#assertWritable();
    const object = await writeObject(this.objectsDir, bytes);
    try {
      this.#db.exec("BEGIN IMMEDIATE");
      this.#db.prepare(`
        INSERT OR IGNORE INTO object_refs (sha256, relative_path, bytes, created_at)
        VALUES (?, ?, ?, ?)
      `).run(object.sha256, object.relativePath, object.bytes, new Date().toISOString());
      this.#db.exec("COMMIT");
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
    return object;
  }

  getObjectRecord(sha256: string): PersistedObjectRecord | null {
    if (this.#closed) return null;
    try {
      const row = this.#db.prepare(`
        SELECT sha256, relative_path, bytes
        FROM object_refs WHERE sha256 = ?
      `).get(sha256) as { sha256: string; relative_path: string; bytes: number } | undefined;
      return row ? { sha256: row.sha256, relativePath: row.relative_path, bytes: row.bytes } : null;
    } catch (error) {
      if (this.readOnly && String((error as Error).message).includes("no such table")) return null;
      throw error;
    }
  }

  registerSource(input: PersistedSourceRecord): PersistedSourceRecord {
    this.#assertWritable();
    try {
      this.#db.exec("BEGIN IMMEDIATE");
      this.#db.prepare(`
        INSERT OR IGNORE INTO source_records
          (source_id, file_name, media_type, raw_sha256, text_sha256, bytes, imported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.sourceId, input.fileName, input.mediaType, input.rawSha256,
        input.textSha256, input.bytes, input.importedAt
      );
      const row = this.#db.prepare(`
        SELECT source_id, file_name, media_type, raw_sha256, text_sha256, bytes, imported_at
        FROM source_records WHERE raw_sha256 = ?
      `).get(input.rawSha256) as {
        source_id: string; file_name: string; media_type: string; raw_sha256: string;
        text_sha256: string; bytes: number; imported_at: string;
      } | undefined;
      this.#db.exec("COMMIT");
      if (!row) throw new Error("source registration did not persist");
      return {
        sourceId: row.source_id, fileName: row.file_name, mediaType: row.media_type,
        rawSha256: row.raw_sha256, textSha256: row.text_sha256,
        bytes: row.bytes, importedAt: row.imported_at
      };
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  createContentRecord(input: { itemId: string; revision: RevisionRecord }): void {
    this.#assertWritable();
    if (!this.getObjectRecord(input.revision.objectSha256)) {
      throw new ContentFactoryError({
        code: "REVISION_OBJECT_MISSING",
        message: "revision object must be persisted before revision metadata",
        retryable: false,
        details: { objectSha256: input.revision.objectSha256 }
      });
    }
    try {
      this.#db.exec("BEGIN IMMEDIATE");
      this.#db.prepare(`
        INSERT INTO content_items (item_id, head_revision_id, created_at)
        VALUES (?, NULL, ?)
      `).run(input.itemId, input.revision.createdAt);
      this.#insertRevision(input.revision);
      this.#db.prepare("UPDATE content_items SET head_revision_id = ? WHERE item_id = ?")
        .run(input.revision.revisionId, input.itemId);
      this.#db.exec("COMMIT");
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  #insertRevision(revision: RevisionRecord): void {
    this.#db.prepare(`
      INSERT INTO content_revisions
        (revision_id, item_id, parent_revision_id, object_sha256, author_kind, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      revision.revisionId, revision.itemId, revision.parentRevisionId,
      revision.objectSha256, revision.authorKind, revision.createdAt
    );
  }

  commitRevision(input: RevisionCommitInput): RevisionCommitResult {
    this.#assertWritable();
    if (!this.getObjectRecord(input.objectSha256)) {
      throw new ContentFactoryError({
        code: "REVISION_OBJECT_MISSING",
        message: "revision object must be persisted before revision metadata",
        retryable: false,
        details: { objectSha256: input.objectSha256 }
      });
    }

    try {
      this.#db.exec("BEGIN IMMEDIATE");
      this.#insertRevision(input);
      const updated = this.#db.prepare(`
        UPDATE content_items
        SET head_revision_id = ?
        WHERE item_id = ? AND head_revision_id = ?
      `).run(input.revisionId, input.itemId, input.expectedRevisionId);
      const head = this.#db.prepare(
        "SELECT head_revision_id FROM content_items WHERE item_id = ?"
      ).get(input.itemId) as { head_revision_id: string | null } | undefined;
      if (!head?.head_revision_id) {
        throw new ContentFactoryError({
          code: "CONTENT_ITEM_NOT_FOUND",
          message: "content item does not exist",
          retryable: false,
          details: { itemId: input.itemId }
        });
      }
      this.#db.exec("COMMIT");
      return {
        status: Number(updated.changes) === 1 ? "advanced" : "conflict",
        currentHeadRevisionId: head.head_revision_id
      };
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  getRevision(revisionId: string): RevisionRecord | null {
    const row = this.#db.prepare(`
      SELECT revision_id, item_id, parent_revision_id, object_sha256, author_kind, created_at
      FROM content_revisions WHERE revision_id = ?
    `).get(revisionId) as {
      revision_id: string; item_id: string; parent_revision_id: string | null;
      object_sha256: string; author_kind: string; created_at: string;
    } | undefined;
    return row ? {
      revisionId: row.revision_id, itemId: row.item_id,
      parentRevisionId: row.parent_revision_id, objectSha256: row.object_sha256,
      authorKind: row.author_kind, createdAt: row.created_at
    } : null;
  }

  getContentHead(itemId: string): string | null {
    const row = this.#db.prepare(
      "SELECT head_revision_id FROM content_items WHERE item_id = ?"
    ).get(itemId) as { head_revision_id: string | null } | undefined;
    return row?.head_revision_id ?? null;
  }

  rollbackHead(input: {
    itemId: string;
    expectedRevisionId: string;
    targetRevisionId: string;
  }): RevisionCommitResult {
    this.#assertWritable();
    const target = this.getRevision(input.targetRevisionId);
    if (!target || target.itemId !== input.itemId) {
      throw new ContentFactoryError({
        code: "REVISION_TARGET_INVALID",
        message: "rollback target does not belong to the content item",
        retryable: false
      });
    }
    try {
      this.#db.exec("BEGIN IMMEDIATE");
      const updated = this.#db.prepare(`
        UPDATE content_items
        SET head_revision_id = ?
        WHERE item_id = ? AND head_revision_id = ?
      `).run(input.targetRevisionId, input.itemId, input.expectedRevisionId);
      const current = this.getContentHead(input.itemId);
      if (!current) throw new Error("content item does not exist");
      this.#db.exec("COMMIT");
      return {
        status: Number(updated.changes) === 1 ? "advanced" : "conflict",
        currentHeadRevisionId: current
      };
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  createOrLoadDeliverySubmission(input: DeliverySubmissionRecord): DeliverySubmissionRecord {
    this.#assertWritable();
    this.#db.prepare(`
      INSERT OR IGNORE INTO delivery_submissions
        (intent_id, bundle_hash, account_alias, request_id, status,
         remote_draft_id, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.intentId, input.bundleHash, input.accountAlias, input.requestId,
      input.status, input.remoteDraftId, input.reason, input.createdAt, input.updatedAt
    );
    const persisted = this.getDeliverySubmission(input.intentId);
    if (!persisted) throw new Error("delivery submission did not persist");
    if (persisted.bundleHash !== input.bundleHash
        || persisted.accountAlias !== input.accountAlias) {
      throw new ContentFactoryError({
        code: "DELIVERY_SUBMISSION_IDENTITY_CONFLICT",
        message: "delivery intent identity is already bound to another bundle or account",
        retryable: false
      });
    }
    return persisted;
  }

  getDeliverySubmission(intentId: string): DeliverySubmissionRecord | null {
    const row = this.#db.prepare(`
      SELECT intent_id, bundle_hash, account_alias, request_id, status,
             remote_draft_id, reason, created_at, updated_at
      FROM delivery_submissions WHERE intent_id = ?
    `).get(intentId) as {
      intent_id: string; bundle_hash: string; account_alias: string; request_id: string;
      status: DeliverySubmissionRecord["status"]; remote_draft_id: string | null;
      reason: string | null; created_at: string; updated_at: string;
    } | undefined;
    return row ? {
      intentId: row.intent_id,
      bundleHash: row.bundle_hash,
      accountAlias: row.account_alias,
      requestId: row.request_id,
      status: row.status,
      remoteDraftId: row.remote_draft_id,
      reason: row.reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } : null;
  }

  updateDeliverySubmission(input: {
    intentId: string;
    status: DeliverySubmissionRecord["status"];
    remoteDraftId: string | null;
    reason: string | null;
    updatedAt: string;
  }): DeliverySubmissionRecord {
    this.#assertWritable();
    this.#db.prepare(`
      UPDATE delivery_submissions
      SET status = ?, remote_draft_id = ?, reason = ?, updated_at = ?
      WHERE intent_id = ?
    `).run(input.status, input.remoteDraftId, input.reason, input.updatedAt, input.intentId);
    const persisted = this.getDeliverySubmission(input.intentId);
    if (!persisted) throw new Error("delivery submission does not exist");
    return persisted;
  }

  putDeliveryAssetMap(input: DeliveryAssetMapRecord): DeliveryAssetMapRecord {
    this.#assertWritable();
    this.#db.prepare(`
      INSERT OR IGNORE INTO delivery_asset_maps
        (intent_id, artifact_id, sha256, remote_asset_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      input.intentId, input.artifactId, input.sha256,
      input.remoteAssetId, input.createdAt
    );
    const persisted = this.getDeliveryAssetMap(input.intentId, input.artifactId);
    if (!persisted) throw new Error("delivery asset map did not persist");
    if (persisted.sha256 !== input.sha256
        || persisted.remoteAssetId !== input.remoteAssetId) {
      throw new ContentFactoryError({
        code: "DELIVERY_ASSET_MAP_CONFLICT",
        message: "delivery asset mapping is immutable",
        retryable: false
      });
    }
    return persisted;
  }

  getDeliveryAssetMap(intentId: string, artifactId: string): DeliveryAssetMapRecord | null {
    const row = this.#db.prepare(`
      SELECT intent_id, artifact_id, sha256, remote_asset_id, created_at
      FROM delivery_asset_maps WHERE intent_id = ? AND artifact_id = ?
    `).get(intentId, artifactId) as {
      intent_id: string; artifact_id: string; sha256: string;
      remote_asset_id: string; created_at: string;
    } | undefined;
    return row ? {
      intentId: row.intent_id,
      artifactId: row.artifact_id,
      sha256: row.sha256,
      remoteAssetId: row.remote_asset_id,
      createdAt: row.created_at
    } : null;
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#db.close();
    await this.#lease.release();
  }
}

export async function openWorkspace(root: string): Promise<WorkspaceStore> {
  const resolvedRoot = path.resolve(root);
  const stateDir = path.join(resolvedRoot, ".content-factory");
  const objectsDir = path.join(stateDir, "objects");
  await mkdir(objectsDir, { recursive: true });

  const lease = await acquireWorkspaceLease(stateDir);
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(path.join(stateDir, "workspace.db"));
    db.exec("PRAGMA foreign_keys = ON");
    const state = migrateWorkspace(db);
    return new WorkspaceStore({
      root: resolvedRoot, stateDir, objectsDir, db, lease,
      schemaVersion: state.schemaVersion, readOnly: state.readOnly
    });
  } catch (error) {
    try { db?.close(); } finally { await lease.release(); }
    throw error;
  }
}
