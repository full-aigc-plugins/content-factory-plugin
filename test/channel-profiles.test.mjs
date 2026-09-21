import assert from "node:assert/strict";
import test from "node:test";

import {
  loadChannelRegistry,
  resolveChannelRecipe,
  validateChannelRegistry
} from "../packages/core/src/channels/registry.ts";

test("CF-045 registry contains exactly 16 channels and 39 explicit channel-format recipes", async () => {
  const registry = await loadChannelRegistry();
  const validation = validateChannelRegistry(registry);
  assert.deepEqual(validation, { ok: true, errors: [] });
  assert.equal(registry.profiles.length, 16);
  assert.equal(registry.recipes.length, 39);

  for (const profile of registry.profiles) {
    for (const format of profile.formats) {
      assert.ok(
        registry.recipes.some(recipe => recipe.channelId === profile.id && recipe.formatId === format),
        `${profile.id}/${format}`
      );
    }
  }
});

test("CF-045 growth podcast and baidu are not publishing profiles", async () => {
  const registry = await loadChannelRegistry();
  for (const invalid of ["growth", "podcast", "baidu"]) {
    assert.equal(registry.profiles.some(profile => profile.id === invalid), false);
    assert.deepEqual(
      resolveChannelRecipe(registry, { channelId: invalid, formatId: "article" }),
      { status: "unsupported", reason: "channel-not-registered" }
    );
  }
});

test("CF-045 native formats resolve to different stage contracts instead of changed CSS", async () => {
  const registry = await loadChannelRegistry();
  const wechat = resolveChannelRecipe(registry, {
    channelId: "wechat-article",
    formatId: "article"
  });
  const xiaohongshu = resolveChannelRecipe(registry, {
    channelId: "xiaohongshu",
    formatId: "carousel_copy"
  });
  const douyin = resolveChannelRecipe(registry, {
    channelId: "douyin",
    formatId: "short_video_script"
  });
  assert.equal(wechat.status, "resolved");
  assert.equal(xiaohongshu.status, "resolved");
  assert.equal(douyin.status, "resolved");
  assert.notDeepEqual(wechat.recipe?.stages, xiaohongshu.recipe?.stages);
  assert.notDeepEqual(xiaohongshu.recipe?.stages, douyin.recipe?.stages);
});

test("CF-045 unknown mandatory platform constraint blocks remote action but preserves working export", async () => {
  const registry = await loadChannelRegistry();
  const resolved = resolveChannelRecipe(registry, {
    channelId: "x",
    formatId: "thread",
    requestedAction: "publish"
  });
  assert.equal(resolved.status, "blocked");
  assert.equal(resolved.reason, "mandatory-constraint-unverified");
  assert.equal(resolved.workingExportAllowed, true);
});
