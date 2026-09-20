import { mkdir, open, rm, type FileHandle } from "node:fs/promises";
import path from "node:path";

import { ContentFactoryError } from "../errors.ts";

export type WorkspaceLease = {
  path: string;
  release(): Promise<void>;
};

export async function acquireWorkspaceLease(stateDir: string): Promise<WorkspaceLease> {
  await mkdir(stateDir, { recursive: true });
  const leasePath = path.join(stateDir, "writer.lock");
  let handle: FileHandle;
  try {
    handle = await open(leasePath, "wx", 0o600);
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
