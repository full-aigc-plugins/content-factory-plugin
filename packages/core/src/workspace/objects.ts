import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type ObjectRecord = {
  sha256: string;
  bytes: number;
  relativePath: string;
  absolutePath: string;
};

export async function writeObject(objectsDir: string, bytes: Uint8Array): Promise<ObjectRecord> {
  await mkdir(objectsDir, { recursive: true });
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const absolutePath = path.join(objectsDir, sha256);
  const relativePath = path.posix.join("objects", sha256);

  try {
    const existing = await stat(absolutePath);
    if (existing.isFile()) {
      return { sha256, bytes: existing.size, relativePath, absolutePath };
    }
  } catch {}

  const temporary = path.join(objectsDir, `.${sha256}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
    await rename(temporary, absolutePath);
  } finally {
    await rm(temporary, { force: true });
  }

  const persisted = await stat(absolutePath);
  return { sha256, bytes: persisted.size, relativePath, absolutePath };
}
