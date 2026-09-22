import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rm
} from "node:fs/promises";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

import { ContentFactoryError } from "../errors.ts";

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function backupWorkspaceDatabase(
  stateDir: string,
  destination: string
): Promise<{ path: string; bytes: number; sha256: string }> {
  const source = path.join(path.resolve(stateDir), "workspace.db");
  const target = path.resolve(destination);
  if (source === target) {
    throw new ContentFactoryError({
      code: "WORKSPACE_BACKUP_TARGET_INVALID",
      message: "workspace backup target must differ from the live database",
      retryable: false
    });
  }
  if (await exists(target)) {
    throw new ContentFactoryError({
      code: "WORKSPACE_BACKUP_TARGET_EXISTS",
      message: "workspace backup target already exists",
      retryable: false
    });
  }
  await mkdir(path.dirname(target), { recursive: true });
  const database = new DatabaseSync(source, { readOnly: true });
  try {
    await backup(database, target);
  } catch (caught) {
    await rm(target, { force: true });
    throw caught;
  } finally {
    database.close();
  }
  const bytes = await readFile(target);
  return {
    path: target,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}
