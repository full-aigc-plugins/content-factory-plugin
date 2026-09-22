import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type TestContextLike = {
  after(cleanup: () => void | Promise<void>): void;
};

type Closeable = {
  close(): void | Promise<void>;
};

type CleanupRegistry = {
  closeables: Closeable[];
  roots: string[];
};

const registries = new WeakMap<object, CleanupRegistry>();

function registryFor(t: TestContextLike): CleanupRegistry {
  const key = t as object;
  const existing = registries.get(key);
  if (existing) return existing;

  const registry: CleanupRegistry = { closeables: [], roots: [] };
  registries.set(key, registry);
  t.after(async () => {
    const errors: unknown[] = [];
    for (const closeable of registry.closeables.reverse()) {
      try {
        await closeable.close();
      } catch (error) {
        errors.push(error);
      }
    }
    for (const root of registry.roots.reverse()) {
      try {
        await rm(root, { recursive: true, force: true });
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "test resource cleanup failed");
    }
  });
  return registry;
}

export async function temporaryDirectory(
  t: TestContextLike,
  prefix: string
): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  registryFor(t).roots.push(root);
  return root;
}

export function manageCloseable(t: TestContextLike, closeable: Closeable): void {
  registryFor(t).closeables.push(closeable);
}
