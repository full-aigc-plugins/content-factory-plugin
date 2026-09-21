import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createWorkspace } from "../../src/workspace/workspace.js";

test("workspace creates deterministic local layout", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-"));
  const workspace = await createWorkspace(root);

  assert.equal(workspace.root, path.resolve(root));
  assert.equal(workspace.stateDir, path.join(path.resolve(root), ".content-factory"));
  assert.equal(workspace.objectsDir, path.join(workspace.stateDir, "objects"));
  assert.equal(workspace.exportsDir, path.join(workspace.stateDir, "exports"));
  assert.equal(workspace.dbPath, path.join(workspace.stateDir, "workspace.db"));

  workspace.close();
});

test("object store is content addressed and deduplicates identical bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-"));
  const workspace = await createWorkspace(root);

  const first = await workspace.objects.put(Buffer.from("hello", "utf8"));
  const second = await workspace.objects.put(Buffer.from("hello", "utf8"));

  assert.equal(first.sha256, second.sha256);
  assert.equal(first.path, second.path);
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(await readFile(first.path, "utf8"), "hello");

  workspace.close();
});

test("workspace transaction commits as one unit", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-"));
  const workspace = await createWorkspace(root);
  workspace.db.exec("CREATE TABLE demo (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");

  workspace.transaction(() => {
    workspace.db.prepare("INSERT INTO demo(value) VALUES (?)").run("a");
    workspace.db.prepare("INSERT INTO demo(value) VALUES (?)").run("b");
  });

  const row = workspace.db.prepare("SELECT COUNT(*) AS count FROM demo").get() as { count: number };
  assert.equal(row.count, 2);
  workspace.close();
});

test("workspace transaction rolls back every write after failure", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-"));
  const workspace = await createWorkspace(root);
  workspace.db.exec("CREATE TABLE demo (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");

  assert.throws(() => {
    workspace.transaction(() => {
      workspace.db.prepare("INSERT INTO demo(value) VALUES (?)").run("a");
      throw new Error("stop");
    });
  }, /stop/);

  const row = workspace.db.prepare("SELECT COUNT(*) AS count FROM demo").get() as { count: number };
  assert.equal(row.count, 0);
  workspace.close();
});

test("workspace schema records its current schema version", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-"));
  const workspace = await createWorkspace(root);

  const row = workspace.db.prepare("SELECT value FROM workspace_meta WHERE key = ?").get("schema_version") as { value: string };
  assert.equal(row.value, "1");
  workspace.close();
});
