import type { DatabaseSync } from "node:sqlite";

export const CURRENT_SCHEMA_VERSION = 5;

export type MigrationState = {
  schemaVersion: number;
  readOnly: boolean;
};

export function readSchemaVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version?: number } | undefined;
  return Number(row?.user_version ?? 0);
}

export function migrateWorkspace(db: DatabaseSync): MigrationState {
  const current = readSchemaVersion(db);
  if (current > CURRENT_SCHEMA_VERSION) {
    return { schemaVersion: current, readOnly: true };
  }
  if (current === CURRENT_SCHEMA_VERSION) {
    return { schemaVersion: current, readOnly: false };
  }

  try {
    db.exec("BEGIN IMMEDIATE");

    if (current < 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS object_refs (
          sha256 TEXT PRIMARY KEY,
          relative_path TEXT NOT NULL,
          bytes INTEGER NOT NULL CHECK (bytes >= 0),
          created_at TEXT NOT NULL
        );
      `);
    }

    if (current < 2) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS source_records (
          source_id TEXT PRIMARY KEY,
          file_name TEXT NOT NULL,
          media_type TEXT NOT NULL,
          raw_sha256 TEXT NOT NULL UNIQUE,
          text_sha256 TEXT NOT NULL,
          bytes INTEGER NOT NULL CHECK (bytes > 0),
          imported_at TEXT NOT NULL,
          FOREIGN KEY (raw_sha256) REFERENCES object_refs(sha256)
        );
      `);
    }

    if (current < 3) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS content_items (
          item_id TEXT PRIMARY KEY,
          head_revision_id TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS content_revisions (
          revision_id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          parent_revision_id TEXT,
          object_sha256 TEXT NOT NULL,
          author_kind TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (item_id) REFERENCES content_items(item_id),
          FOREIGN KEY (parent_revision_id) REFERENCES content_revisions(revision_id),
          FOREIGN KEY (object_sha256) REFERENCES object_refs(sha256)
        );

        CREATE INDEX IF NOT EXISTS idx_content_revisions_item
          ON content_revisions(item_id, created_at);
      `);
    }

    if (current < 4) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS workflow_runs (
          run_id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          cancelled_at TEXT,
          cancel_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS workflow_steps (
          run_id TEXT NOT NULL,
          stage_id TEXT NOT NULL,
          ordinal INTEGER NOT NULL,
          status TEXT NOT NULL,
          input_hash TEXT NOT NULL,
          output_sha256 TEXT,
          evidence_json TEXT NOT NULL DEFAULT '[]',
          external_calls INTEGER NOT NULL DEFAULT 0 CHECK (external_calls >= 0),
          PRIMARY KEY (run_id, stage_id),
          FOREIGN KEY (run_id) REFERENCES workflow_runs(run_id)
        );

        CREATE TABLE IF NOT EXISTS workflow_events (
          run_id TEXT NOT NULL,
          sequence INTEGER NOT NULL,
          type TEXT NOT NULL,
          stage_id TEXT,
          payload_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (run_id, sequence),
          FOREIGN KEY (run_id) REFERENCES workflow_runs(run_id)
        );
      `);
    }

    if (current < 5) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS delivery_submissions (
          intent_id TEXT PRIMARY KEY,
          bundle_hash TEXT NOT NULL,
          account_alias TEXT NOT NULL,
          request_id TEXT NOT NULL,
          status TEXT NOT NULL,
          remote_draft_id TEXT,
          reason TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS delivery_asset_maps (
          intent_id TEXT NOT NULL,
          artifact_id TEXT NOT NULL,
          sha256 TEXT NOT NULL,
          remote_asset_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (intent_id, artifact_id),
          FOREIGN KEY (intent_id) REFERENCES delivery_submissions(intent_id)
        );
      `);
    }

    db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION}`);
    db.exec("COMMIT");
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  }

  return { schemaVersion: CURRENT_SCHEMA_VERSION, readOnly: false };
}
