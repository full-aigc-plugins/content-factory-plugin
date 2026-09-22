import assert from "node:assert/strict";
import test from "node:test";

import {
  createChannelVariants,
  reviseChannelVariant
} from "../../packages/core/src/content/channel-variants.ts";
import { evaluateChannelValidity } from "../../packages/core/src/review/channel-validity.ts";

const targets = [
  { channelId: "wechat", formatId: "article", locale: "zh-CN", text: "长文正文", presentation: "theme-a" },
  { channelId: "xiaohongshu", formatId: "note", locale: "zh-CN", text: "笔记正文", presentation: "cards" },
  { channelId: "douyin", formatId: "short_video_script", locale: "zh-CN", text: "口播正文", presentation: "subtitles" }
];

test("CF-052 creates independent sibling revisions and hashes from one source bundle", () => {
  const variants = createChannelVariants({ sourceBundleId: "source-1", targets });
  assert.equal(variants.length, 3);
  assert.equal(new Set(variants.map(item => item.variantId)).size, 3);
  assert.equal(new Set(variants.map(item => item.siblingGroupId)).size, 1);
  assert.equal(new Set(variants.map(item => item.revisionId)).size, 3);
  assert.equal(new Set(variants.map(item => item.textHash)).size, 3);
  assert.equal(variants.every(item => item.revisionNumber === 1), true);
});

test("CF-052 changing one sibling invalidates only evidence bound to that sibling", () => {
  const variants = createChannelVariants({ sourceBundleId: "source-1", targets });
  const before = variants[1];
  const revised = reviseChannelVariant(variants, {
    variantId: before.variantId,
    expectedRevisionId: before.revisionId,
    text: "笔记正文第二版"
  });
  assert.equal(revised.status, "advanced");
  assert.equal(revised.variants[0], variants[0]);
  assert.equal(revised.variants[2], variants[2]);
  assert.notEqual(revised.variant.revisionId, before.revisionId);
  assert.notEqual(revised.variant.textHash, before.textHash);

  const changed = evaluateChannelValidity({ previous: before, current: revised.variant });
  const untouched = evaluateChannelValidity({ previous: variants[0], current: revised.variants[0] });
  assert.equal(changed.detectionReusable, false);
  assert.equal(changed.approvalReusable, false);
  assert.deepEqual(changed.reasons, ["canonical-text-changed"]);
  assert.equal(untouched.detectionReusable, true);
  assert.equal(untouched.approvalReusable, true);
  assert.deepEqual(untouched.reasons, []);
});

test("CF-052 channel, format, or locale change invalidates dependent evidence", () => {
  const [variant] = createChannelVariants({ sourceBundleId: "source-1", targets: [targets[0]] });
  for (const patch of [
    { channelId: "xiaohongshu" },
    { formatId: "note" },
    { locale: "en-US" }
  ]) {
    const current = { ...variant, ...patch };
    const validity = evaluateChannelValidity({ previous: variant, current });
    assert.equal(validity.detectionReusable, false);
    assert.equal(validity.approvalReusable, false);
    assert.equal(validity.deliveryReviewRequired, true);
  }
});

test("CF-052 stale expected revision is a conflict and mutates no sibling", () => {
  const variants = createChannelVariants({ sourceBundleId: "source-1", targets });
  const result = reviseChannelVariant(variants, {
    variantId: variants[0].variantId,
    expectedRevisionId: "revision-stale",
    text: "不得写入"
  });
  assert.equal(result.status, "conflict");
  assert.deepEqual(result.variants, variants);
});
