import assert from "node:assert/strict";
import test from "node:test";

import { importTextSource } from "../packages/core/src/content/import-text.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { manageCloseable, temporaryDirectory } from "../tests/support/temp-directory.ts";

async function temporaryWorkspace(t) {
  const root = await temporaryDirectory(t, "content-factory-import-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  return store;
}

test("CF-008 imports UTF-8 Markdown while preserving raw bytes and extracted text", async t => {
  const store = await temporaryWorkspace(t);
  const bytes = Buffer.from("# 标题\n\n正文 Content Factory\n", "utf8");

  const source = await importTextSource(store, {
    fileName: "资料/文章.md",
    bytes,
    mediaType: "text/markdown"
  });

  assert.match(source.sourceId, /^src_[0-9a-f]{24}$/);
  assert.equal(source.fileName, "资料/文章.md");
  assert.equal(source.mediaType, "text/markdown");
  assert.equal(source.text, "# 标题\n\n正文 Content Factory\n");
  assert.match(source.rawSha256, /^[0-9a-f]{64}$/);
  assert.equal(source.rawSha256, source.textSha256);
  assert.equal(source.bytes, bytes.length);
  assert.equal(store.getObjectRecord(source.rawSha256)?.sha256, source.rawSha256);
});

test("CF-008 deduplicates identical bytes but preserves same-name changed content as a new source", async t => {
  const store = await temporaryWorkspace(t);
  const first = await importTextSource(store, {
    fileName: "article.md",
    bytes: Buffer.from("version one", "utf8")
  });
  const duplicate = await importTextSource(store, {
    fileName: "article.md",
    bytes: Buffer.from("version one", "utf8")
  });
  const changed = await importTextSource(store, {
    fileName: "article.md",
    bytes: Buffer.from("version two", "utf8")
  });

  assert.equal(duplicate.sourceId, first.sourceId);
  assert.equal(duplicate.rawSha256, first.rawSha256);
  assert.notEqual(changed.sourceId, first.sourceId);
  assert.notEqual(changed.rawSha256, first.rawSha256);
});

test("CF-008 rejects empty, invalid UTF-8, and explicitly over-budget text without truncation", async t => {
  const store = await temporaryWorkspace(t);

  await assert.rejects(
    () => importTextSource(store, { fileName: "empty.txt", bytes: Buffer.alloc(0) }),
    error => error?.code === "SOURCE_EMPTY"
  );

  await assert.rejects(
    () => importTextSource(store, { fileName: "bad.txt", bytes: Buffer.from([0xff, 0xfe, 0xfd]) }),
    error => error?.code === "SOURCE_ENCODING_UNSUPPORTED"
  );

  const over = Buffer.from("12345", "utf8");
  await assert.rejects(
    () => importTextSource(store, { fileName: "large.txt", bytes: over, maxBytes: 4 }),
    error => error?.code === "SOURCE_TOO_LARGE"
      && error?.details?.actualBytes === 5
      && error?.details?.maxBytes === 4
  );
});

test("CF-008 source schema separates original object identity from extracted representation", async () => {
  const { readFile } = await import("node:fs/promises");
  const schema = JSON.parse(await readFile("schemas/source.schema.json", "utf8"));
  for (const field of [
    "sourceId", "fileName", "mediaType", "rawSha256",
    "textSha256", "bytes", "text", "importedAt"
  ]) {
    assert.ok(schema.required.includes(field), field);
  }
});
