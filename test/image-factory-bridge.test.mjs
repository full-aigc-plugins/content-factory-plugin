import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  probeImageFactory,
  validateImageFactoryReceipt
} from "../adapters/image-factory/probe.ts";

const RECEIPT_SCHEMA_ID =
  "https://github.com/full-aigc-plugins/image-factory-plugin/schemas/artifact_receipt.schema.json";

test("CF-006 unavailable Image Factory stays unavailable without external calls", () => {
  const report = probeImageFactory({ advertised: false });
  assert.equal(report.status, "unavailable");
  assert.equal(report.externalCalls, 0);
  assert.equal(report.contractVersion, null);
});

test("CF-006 accepts the verified Image Factory artifact receipt contract", () => {
  const report = probeImageFactory({
    advertised: true,
    contractVersion: "1.0.0",
    receiptSchemaId: RECEIPT_SCHEMA_ID
  });
  assert.equal(report.status, "available");
  assert.equal(report.externalCalls, 0);
  assert.equal(report.receiptSchemaId, RECEIPT_SCHEMA_ID);
});

test("CF-006 validates receipt identity and integrity fields", () => {
  const valid = {
    schema_version: "1.0.0",
    plugin_id: "image-factory",
    batch_id: "batch_001",
    item_id: "cover",
    round: 1,
    artifact_id: "artifact_001",
    path: "generated/cover.png",
    sha256: "a".repeat(64),
    bytes: 1024,
    width: 1200,
    height: 628,
    prompt_sha256: "b".repeat(64),
    idempotency_key: "c".repeat(64),
    source: {
      kind: "codex_image_gen",
      session_id: "session-1",
      call_id: "call-1",
      model_reported: null
    },
    collected_at: "2026-09-20T00:00:00Z"
  };

  assert.deepEqual(validateImageFactoryReceipt(valid), { ok: true, errors: [] });

  const invalid = structuredClone(valid);
  invalid.sha256 = "not-a-hash";
  invalid.bytes = 0;
  const result = validateImageFactoryReceipt(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("sha256"));
  assert.ok(result.errors.includes("bytes"));
});

test("CF-006 compatibility schema preserves upstream required receipt fields", async () => {
  const schema = JSON.parse(await readFile("schemas/image-factory-receipt.schema.json", "utf8"));
  assert.equal(schema.properties.plugin_id.const, "image-factory");
  for (const name of [
    "schema_version", "plugin_id", "batch_id", "item_id", "round",
    "artifact_id", "path", "sha256", "bytes", "width", "height",
    "prompt_sha256", "idempotency_key", "source", "collected_at"
  ]) {
    assert.ok(schema.required.includes(name), name);
  }
});

test("CF-006 Content Factory vendor lock contains no image generation skills", async () => {
  const lock = JSON.parse(await readFile("skills.lock.json", "utf8"));
  const names = lock.sources.flatMap(source => source.skills);
  for (const forbidden of [
    "baoyu-image-gen",
    "baoyu-cover-image",
    "baoyu-article-illustrator",
    "baoyu-xhs-images",
    "baoyu-infographic",
    "baoyu-comic",
    "baoyu-diagram",
    "baoyu-slide-deck"
  ]) {
    assert.ok(!names.includes(forbidden), forbidden);
  }
});
