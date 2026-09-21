import assert from "node:assert/strict";
import test from "node:test";

import { probeHost } from "../adapters/host/probe.ts";
import { resolvePlatformContext } from "../packages/core/src/channels/context.ts";
import { loadChannelRegistry } from "../packages/core/src/channels/registry.ts";
import { selectContentRecipe } from "../packages/core/src/channels/select-recipe.ts";

function target(channel, format, locale = "zh-CN") {
  return {
    channel,
    format,
    locale,
    audience: "目标读者",
    goal: "解释",
    taskKind: "original_write",
    requestedAction: "draft",
    accountRef: null
  };
}

test("CF-046 selects a native recipe before writing and records a replayable decision", async () => {
  const registry = await loadChannelRegistry();
  const context = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
    sources: [{ sourceId: "s1", platform: "youtube", uri: "https://youtube.com/watch?v=1" }],
    explicitTarget: target("xiaohongshu", "carousel_copy")
  });
  const decision = selectContentRecipe({
    context,
    registry,
    mode: "full",
    taskKind: "original_write",
    inputHash: "a".repeat(64)
  });

  assert.equal(decision.status, "resolved");
  assert.equal(decision.profileRef, "xiaohongshu@1");
  assert.equal(decision.recipeRef, "xiaohongshu/carousel_copy@1");
  assert.ok(decision.stages.includes("card-copy"));
  assert.ok(decision.stages.indexOf("card-copy") < decision.stages.indexOf("visual-brief"));
  assert.equal(decision.taskKind, "original_write");
  assert.equal(decision.inputHash, "a".repeat(64));
  assert.ok(decision.stages.indexOf("edit") < decision.stages.indexOf("format"));
  assert.ok(decision.stages.indexOf("format") < decision.stages.indexOf("review"));
  assert.equal(decision.stages.at(-1), "review");
});

test("CF-046 formatting-only mode omits research rewriting detection and delivery", async () => {
  const registry = await loadChannelRegistry();
  const context = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "zcode" } }),
    sources: [],
    explicitTarget: target("wechat-article", "article")
  });
  const decision = selectContentRecipe({
    context,
    registry,
    mode: "format",
    taskKind: "authorized_transform",
    inputHash: "b".repeat(64)
  });
  assert.deepEqual(decision.stages, ["format", "review"]);
  for (const forbidden of ["research", "write", "detect", "deliver"]) {
    assert.equal(decision.stages.includes(forbidden), false);
  }
});

test("CF-046 unresolved or conflicting target returns clarification without selecting a default recipe", async () => {
  const registry = await loadChannelRegistry();
  const ambiguous = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "kimi" } }),
    sources: [],
    requestText: "发微信"
  });
  const decision = selectContentRecipe({
    context: ambiguous,
    registry,
    mode: "deliver",
    taskKind: "authorized_transform",
    inputHash: "c".repeat(64)
  });
  assert.deepEqual(decision, {
    status: "needs_clarification",
    reasons: ["ambiguous-wechat-family"],
    stages: [],
    selectedBindings: [],
    rejectedBindings: []
  });
});

test("CF-046 Douyin and TikTok requests select distinct profile and recipe revisions", async () => {
  const registry = await loadChannelRegistry();
  const makeDecision = channel => selectContentRecipe({
    context: resolvePlatformContext({
      host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
      sources: [],
      explicitTarget: target(channel, "short_video_script", channel === "douyin" ? "zh-CN" : "en-US")
    }),
    registry,
    mode: "full",
    taskKind: "original_write",
    inputHash: "d".repeat(64)
  });
  const douyin = makeDecision("douyin");
  const tiktok = makeDecision("tiktok");
  assert.equal(douyin.profileRef, "douyin@1");
  assert.equal(tiktok.profileRef, "tiktok@1");
  assert.notEqual(douyin.recipeRef, tiktok.recipeRef);
});
