import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  bindChannelMediaReceipt,
  createChannelMediaPlan,
  summarizeChannelMediaPlan
} from "../packages/core/src/channels/assets.ts";
import { bindImageFactoryResultToChannelPlan } from "../adapters/image-factory/bridge.ts";

const fixture = JSON.parse(await readFile(
  new URL("../tests/fixtures/channel-media/media-needs.json", import.meta.url),
  "utf8"
));

test("CF-051 keeps text ready while a missing Image Factory blocks only the visual branch", () => {
  const plan = createChannelMediaPlan({
    ...fixture.article,
    imageFactoryStatus: "unavailable"
  });

  assert.equal(plan.textStatus, "ready");
  assert.deepEqual(plan.branches, [{
    branchId: "media_cover",
    needId: "cover",
    kind: "generated-image",
    producer: "image-factory",
    status: "blocked",
    reason: "image-factory-unavailable",
    brief: {
      briefId: "media_cover",
      revisionId: fixture.article.contentRevisionId,
      anchor: "document:cover",
      purpose: "article cover",
      assetKind: "cover",
      aspectRatio: "16:9",
      textConstraints: [],
      sourceRefs: ["claim_runtime"],
      generationStatus: "not-requested"
    },
    mediaBrief: {
      schemaVersion: 1,
      briefId: "media_cover",
      variantRef: fixture.article.variantRef,
      contentRevisionId: fixture.article.contentRevisionId,
      channelId: "wechat-article",
      formatId: "article",
      kind: "generated-image",
      purpose: "article cover",
      anchor: "document:cover",
      imageProducer: "image-factory"
    },
    receipt: null
  }]);
  assert.deepEqual(summarizeChannelMediaPlan(plan), {
    textStatus: "ready",
    packageKind: "text-with-media-pending",
    completedMediaArtifacts: 0,
    pendingBranches: ["media_cover"],
    published: false
  });
});

test("CF-051 routes generated images only to Image Factory and keeps visual skills out of the lock", async () => {
  const plan = createChannelMediaPlan({
    ...fixture.article,
    imageFactoryStatus: "available"
  });
  assert.equal(plan.branches[0].producer, "image-factory");
  assert.equal(plan.branches[0].status, "ready-for-approved-request");

  const lock = JSON.parse(await readFile("skills.lock.json", "utf8"));
  const skillIds = lock.sources.flatMap(source => source.skills);
  assert.equal(skillIds.some(skillId => /image|cover|illustrat|diagram|infographic/u.test(skillId)), false);
});

test("CF-051 converts a verified Image Factory result into a variant-bound channel receipt", () => {
  const plan = createChannelMediaPlan({
    ...fixture.article,
    imageFactoryStatus: "available"
  });
  const fulfilled = bindImageFactoryResultToChannelPlan(plan, "media_cover", {
    status: "succeeded",
    asset: {
      requestId: "request_cover_1",
      variantRef: fixture.article.contentRevisionId,
      artifactId: "artifact_cover_1",
      path: "generated/cover.png",
      sha256: "b".repeat(64),
      bytes: 4096,
      width: 1200,
      height: 628,
      modelReported: null
    },
    reconciled: false,
    retry: "never"
  });

  assert.equal(fulfilled.branches[0].status, "fulfilled");
  assert.deepEqual(fulfilled.branches[0].receipt, {
    receiptId: "image_factory_request_cover_1",
    branchId: "media_cover",
    variantRef: fixture.article.variantRef,
    contentRevisionId: fixture.article.contentRevisionId,
    artifactId: "artifact_cover_1",
    artifactKind: "binary-media",
    mediaType: "image/png",
    sha256: "b".repeat(64),
    bytes: 4096,
    producer: "image-factory"
  });
});

test("CF-051 reports script and show-notes as a script package until external media receipts exist", () => {
  const plan = createChannelMediaPlan({
    ...fixture.script,
    imageFactoryStatus: "available"
  });

  assert.deepEqual(plan.branches.map(branch => ({
    kind: branch.kind,
    producer: branch.producer,
    status: branch.status,
    receipt: branch.receipt
  })), [
    {
      kind: "external-video",
      producer: "external-capability",
      status: "script-only",
      receipt: null
    },
    {
      kind: "external-audio",
      producer: "external-capability",
      status: "script-only",
      receipt: null
    }
  ]);
  assert.deepEqual(summarizeChannelMediaPlan(plan), {
    textStatus: "ready",
    packageKind: "script-package",
    completedMediaArtifacts: 0,
    pendingBranches: ["media_video", "media_audio"],
    published: false
  });
});

test("CF-051 rejects stale variant receipts and scripts mislabeled as binary media", () => {
  const plan = createChannelMediaPlan({
    ...fixture.script,
    imageFactoryStatus: "available"
  });
  const validReceipt = {
    receiptId: "receipt_video_1",
    branchId: "media_video",
    variantRef: fixture.script.variantRef,
    contentRevisionId: fixture.script.contentRevisionId,
    artifactId: "video_artifact_1",
    artifactKind: "binary-media",
    mediaType: "video/mp4",
    sha256: "a".repeat(64),
    bytes: 2048,
    producer: "external-capability"
  };

  assert.throws(
    () => bindChannelMediaReceipt(plan, {
      ...validReceipt,
      variantRef: "variant_douyin_script_1"
    }),
    error => error?.code === "MEDIA_RECEIPT_STALE_VARIANT"
  );
  assert.throws(
    () => bindChannelMediaReceipt(plan, {
      ...validReceipt,
      artifactKind: "script"
    }),
    error => error?.code === "MEDIA_RECEIPT_ARTIFACT_KIND_INVALID"
  );

  const fulfilled = bindChannelMediaReceipt(plan, validReceipt);
  assert.deepEqual(summarizeChannelMediaPlan(fulfilled), {
    textStatus: "ready",
    packageKind: "media-package",
    completedMediaArtifacts: 1,
    pendingBranches: ["media_audio"],
    published: false
  });
  assert.equal(plan.branches[0].receipt, null);
});

test("CF-051 media brief schema separates generated images from external video and audio", async () => {
  const schema = JSON.parse(await readFile("schemas/media-brief.schema.json", "utf8"));
  assert.deepEqual(schema.properties.kind.enum, [
    "generated-image",
    "external-video",
    "external-audio"
  ]);
  assert.equal(schema.properties.imageProducer.const, "image-factory");
  assert.equal(schema.properties.externalProducer.const, "external-capability");
  assert.ok(schema.required.includes("variantRef"));
  assert.ok(schema.required.includes("contentRevisionId"));
}
);
