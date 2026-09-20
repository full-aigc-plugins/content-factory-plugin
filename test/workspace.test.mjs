import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { writeObject } from "../packages/core/src/workspace/objects.ts";

async function temporaryWorkspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-workspace-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

test("CF-007 creates a workspace and commits object metadata only after the object exists", async t => {
  const root = await temporaryWorkspace(t);
  const store = await openWorkspace(root);
  t.after(async () => store.close());

  const record = await store.putObject(Buffer.from("你好 Content Factory", "utf8"));
  assert.match(record.sha256, /^[0-9a-f]{64}$/);
  assert.equal(record.bytes, Buffer.byteLength("你好 Content Factory"));
  assert.equal((await stat(record.absolutePath)).isFile(), true);

  const persisted = store.getObjectRecord(record.sha256);
  assert.deepEqual(persisted, {
    sha256: record.sha256,
    relativePath: record.relativePath,
    bytes: record.bytes
  });
});

test("CF-007 crash between object write and database registration leaves no committed dangling reference", async t => {
  const root = await temporaryWorkspace(t);
  const state = path.join(root, ".content-factory");
  const objects = path.join(state, "objects");
  await mkdir(objects, { recursive: true });

  const orphan = await writeObject(objects, Buffer.from("orphan-before-commit"));
  const store = await openWorkspace(root);
  t.after(async () => store.close());

  assert.equal((await stat(orphan.absolutePath)).isFile(), true);
  assert.equal(store.getObjectRecord(orphan.sha256), null);
});

test("CF-007 rejects a second writer while the workspace lease is held", async t => {
  const root = await temporaryWorkspace(t);
  const first = await openWorkspace(root);
  t.after(async () => first.close());

  await assert.rejects(
    () => openWorkspace(root),
    error => error?.code === "WORKSPACE_LOCKED"
  );

  await first.close();
  const second = await openWorkspace(root);
  await second.close();
});

test("CF-007 future schema opens read-only and blocks writes", async t => {
  const root = await temporaryWorkspace(t);
  const state = path.join(root, ".content-factory");
  await mkdir(state, { recursive: true });
  const db = new DatabaseSync(path.join(state, "workspace.db"));
  db.exec("PRAGMA user_version = 99");
  db.close();

  const store = await openWorkspace(root);
  t.after(async () => store.close());
  assert.equal(store.readOnly, true);
  assert.equal(store.schemaVersion, 99);

  await assert.rejects(
    () => store.putObject(Buffer.from("blocked")),
    error => error?.code === "WORKSPACE_READ_ONLY_FUTURE_SCHEMA"
  );
});
