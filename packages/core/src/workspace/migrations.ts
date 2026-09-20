import type { DatabaseSync } from "node:sqlite";

export const CURRENT_SCHEMA_VERSION = 2;

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

    db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION}`);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }

  return { schemaVersion: CURRENT_SCHEMA_VERSION, readOnly: false };
}
