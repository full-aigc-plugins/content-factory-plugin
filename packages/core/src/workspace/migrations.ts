import type { DatabaseSync } from "node:sqlite";

export const CURRENT_SCHEMA_VERSION = 1;

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
    db.exec(`
      CREATE TABLE IF NOT EXISTS object_refs (
        sha256 TEXT PRIMARY KEY,
        relative_path TEXT NOT NULL,
        bytes INTEGER NOT NULL CHECK (bytes >= 0),
        created_at TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }

  return { schemaVersion: CURRENT_SCHEMA_VERSION, readOnly: false };
}
