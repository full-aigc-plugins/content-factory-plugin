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
      try {
        this.#db.exec("ROLLBACK");
      } catch {}
      throw error;
    }
    return object;
  }

  getObjectRecord(sha256: string): PersistedObjectRecord | null {
    if (this.#closed) return null;
    try {
      const row = this.#db.prepare(`
        SELECT sha256, relative_path, bytes
        FROM object_refs
        WHERE sha256 = ?
      `).get(sha256) as { sha256: string; relative_path: string; bytes: number } | undefined;
      return row
        ? { sha256: row.sha256, relativePath: row.relative_path, bytes: row.bytes }
        : null;
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
        input.sourceId,
        input.fileName,
        input.mediaType,
        input.rawSha256,
        input.textSha256,
        input.bytes,
        input.importedAt
      );
      const row = this.#db.prepare(`
        SELECT source_id, file_name, media_type, raw_sha256, text_sha256, bytes, imported_at
        FROM source_records
        WHERE raw_sha256 = ?
      `).get(input.rawSha256) as {
        source_id: string;
        file_name: string;
        media_type: string;
        raw_sha256: string;
        text_sha256: string;
        bytes: number;
        imported_at: string;
      } | undefined;
      this.#db.exec("COMMIT");
      if (!row) throw new Error("source registration did not persist");
      return {
        sourceId: row.source_id,
        fileName: row.file_name,
        mediaType: row.media_type,
        rawSha256: row.raw_sha256,
        textSha256: row.text_sha256,
        bytes: row.bytes,
        importedAt: row.imported_at
      };
    } catch (error) {
      try {
        this.#db.exec("ROLLBACK");
      } catch {}
      throw error;
    }
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
      root: resolvedRoot,
      stateDir,
      objectsDir,
      db,
      lease,
      schemaVersion: state.schemaVersion,
      readOnly: state.readOnly
    });
  } catch (error) {
    try {
      db?.close();
    } finally {
      await lease.release();
    }
    throw error;
  }
}
