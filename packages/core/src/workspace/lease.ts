import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  rm,
  type FileHandle
} from "node:fs/promises";
import path from "node:path";

import { ContentFactoryError } from "../errors.ts";

export type WorkspaceLease = {
  path: string;
  release(): Promise<void>;
};

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    return error.code !== "ESRCH";
  }
}

async function moveDeadLeaseAside(leasePath: string): Promise<boolean> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(leasePath, "utf8"));
  } catch {
    return false;
  }
  if (typeof value !== "object" || value === null) return false;
  const pid = Number((value as Record<string, unknown>).pid);
  if (!Number.isSafeInteger(pid) || pid <= 0 || processIsAlive(pid)) return false;

  const stalePath = `${leasePath}.stale-${randomUUID()}`;
  try {
    await rename(leasePath, stalePath);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return true;
    throw caught;
  }
  await rm(stalePath, { force: true });
  return true;
}

async function openLease(leasePath: string): Promise<FileHandle> {
  try {
    return await open(leasePath, "wx", 0o600);
  } catch (caught) {
    const error = caught as NodeJS.ErrnoException;
    if (error.code !== "EEXIST" || !await moveDeadLeaseAside(leasePath)) {
      throw caught;
    }
    return open(leasePath, "wx", 0o600);
  }
}

export async function acquireWorkspaceLease(stateDir: string): Promise<WorkspaceLease> {
  await mkdir(stateDir, { recursive: true });
  const leasePath = path.join(stateDir, "writer.lock");
  let handle: FileHandle;
  try {
    handle = await openLease(leasePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new ContentFactoryError({
        code: "WORKSPACE_LOCKED",
        message: "workspace already has an active writer lease",
        retryable: true,
        details: { leasePath }
      });
    }
    throw error;
  }

  await handle.writeFile(JSON.stringify({
    pid: process.pid,
    acquiredAt: new Date().toISOString()
  }) + "\n", "utf8");

  let released = false;
  return {
    path: leasePath,
    async release() {
      if (released) return;
      released = true;
      await handle.close();
      await rm(leasePath, { force: true });
    }
  };
}
