import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface StoredObject {
  sha256: string;
  path: string;
  created: boolean;
  bytes: number;
}

export class ObjectStore {
  constructor(readonly root: string) {}

  async put(bytes: Uint8Array): Promise<StoredObject> {
    const data = Buffer.from(bytes);
    const sha256 = createHash("sha256").update(data).digest("hex");
    const destination = path.join(this.root, sha256);

    try {
      const existing = await stat(destination);
      if (!existing.isFile()) {
        throw new Error(`object path is not a file: ${destination}`);
      }
      return { sha256, path: destination, created: false, bytes: data.byteLength };
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || (error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    await mkdir(this.root, { recursive: true });
    const temporary = path.join(this.root, `.${sha256}.${randomUUID()}.tmp`);
    await writeFile(temporary, data, { flag: "wx" });

    try {
      await rename(temporary, destination);
      return { sha256, path: destination, created: true, bytes: data.byteLength };
    } catch (error) {
      const existing = await stat(destination).catch(() => undefined);
      if (existing?.isFile()) {
        return { sha256, path: destination, created: false, bytes: data.byteLength };
      }
      throw error;
    }
  }
}

export interface WorkspaceHandle {
  root: string;
  stateDir: string;
  objectsDir: string;
  exportsDir: string;
  stagingDir: string;
  dbPath: string;
  db: DatabaseSync;
  objects: ObjectStore;
  transaction<T>(operation: () => T): T;
  close(): void;
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workspace_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT INTO workspace_meta(key, value)
      VALUES ('schema_version', '1')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
  `);
}

export async function createWorkspace(inputRoot: string): Promise<WorkspaceHandle> {
  const root = path.resolve(inputRoot);
  const stateDir = path.join(root, ".content-factory");
  const objectsDir = path.join(stateDir, "objects");
  const exportsDir = path.join(stateDir, "exports");
  const stagingDir = path.join(stateDir, "staging");
  const dbPath = path.join(stateDir, "workspace.db");

  await Promise.all([
    mkdir(objectsDir, { recursive: true }),
    mkdir(exportsDir, { recursive: true }),
    mkdir(stagingDir, { recursive: true })
  ]);

  const db = new DatabaseSync(dbPath);
  initializeSchema(db);

  return {
    root,
    stateDir,
    objectsDir,
    exportsDir,
    stagingDir,
    dbPath,
    db,
    objects: new ObjectStore(objectsDir),
    transaction<T>(operation: () => T): T {
      db.exec("BEGIN IMMEDIATE");
      try {
        const result = operation();
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    close(): void {
      db.close();
    }
  };
}
