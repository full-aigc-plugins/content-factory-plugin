import assert from "node:assert/strict";
import test from "node:test";

import {
  createContentItem,
  submitRevision,
  rollbackContentHead
} from "../packages/core/src/content/revisions.ts";
import { diffText } from "../packages/core/src/content/diff.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { manageCloseable, temporaryDirectory } from "../tests/support/temp-directory.ts";

async function workspace(t) {
  const root = await temporaryDirectory(t, "content-factory-revisions-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  return store;
}

test("CF-011 only one submission advances a shared expected head and conflict revision is retained", async t => {
  const store = await workspace(t);
  const initial = await createContentItem(store, {
    text: "base",
    authorKind: "human"
  });

  const first = await submitRevision(store, {
    itemId: initial.itemId,
    expectedRevisionId: initial.headRevisionId,
    text: "agent edit",
    authorKind: "agent"
  });
  const second = await submitRevision(store, {
    itemId: initial.itemId,
    expectedRevisionId: initial.headRevisionId,
    text: "human edit",
    authorKind: "human"
  });

  assert.equal(first.status, "advanced");
  assert.equal(second.status, "conflict");
  assert.equal(second.currentHeadRevisionId, first.revision.revisionId);
  assert.equal(store.getContentHead(initial.itemId), first.revision.revisionId);
  assert.equal(store.getRevision(second.revision.revisionId)?.objectSha256, second.revision.objectSha256);
});

test("CF-011 rollback moves only the head pointer and preserves all immutable revisions", async t => {
  const store = await workspace(t);
  const initial = await createContentItem(store, { text: "v1", authorKind: "human" });
  const v2 = await submitRevision(store, {
    itemId: initial.itemId,
    expectedRevisionId: initial.headRevisionId,
    text: "v2",
    authorKind: "agent"
  });
  assert.equal(v2.status, "advanced");

  const result = rollbackContentHead(store, {
    itemId: initial.itemId,
    expectedRevisionId: v2.revision.revisionId,
    targetRevisionId: initial.headRevisionId
  });

  assert.equal(result.status, "advanced");
  assert.equal(store.getContentHead(initial.itemId), initial.headRevisionId);
  assert.ok(store.getRevision(v2.revision.revisionId));
  assert.ok(store.getObjectRecord(v2.revision.objectSha256));
});

test("CF-011 rejects a candidate whose object hash does not match persisted bytes", async t => {
  const store = await workspace(t);
  const initial = await createContentItem(store, { text: "v1", authorKind: "human" });

  assert.throws(
    () => store.commitRevision({
      revisionId: "rev_bad",
      itemId: initial.itemId,
      parentRevisionId: initial.headRevisionId,
      objectSha256: "f".repeat(64),
      expectedRevisionId: initial.headRevisionId,
      authorKind: "agent",
      createdAt: new Date().toISOString()
    }),
    error => error?.code === "REVISION_OBJECT_MISSING"
  );
});

test("CF-011 diff reports unchanged, removed and added text without mutating inputs", () => {
  const before = "hello world";
  const after = "hello brave world";
  const diff = diffText(before, after);
  assert.equal(diff.commonPrefix, "hello ");
  assert.equal(diff.removed, "");
  assert.equal(diff.added, "brave ");
  assert.equal(diff.commonSuffix, "world");
  assert.equal(before, "hello world");
  assert.equal(after, "hello brave world");
});
