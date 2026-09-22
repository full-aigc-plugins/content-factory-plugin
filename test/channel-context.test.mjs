import assert from "node:assert/strict";
import test from "node:test";

import { probeHost } from "../adapters/host/probe.ts";
import { resolvePlatformContext } from "../packages/core/src/channels/context.ts";

test("CF-044 keeps Codex host and YouTube source independent from Xiaohongshu and WeChat targets", () => {
  const result = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
    sources: [{ sourceId: "s1", platform: "youtube", uri: "https://youtube.com/watch?v=1" }],
    explicitTarget: {
      channel: "xiaohongshu",
      format: "note",
      locale: "zh-CN",
      audience: "开发者",
      goal: "教程",
      taskKind: "original_write",
      requestedAction: "draft",
      accountRef: null
    }
  });

  assert.equal(result.hostContext.hostId, "codex");
  assert.equal(result.sourceContexts[0]?.sourcePlatform, "youtube");
  assert.equal(result.channelIntent.channelId, "xiaohongshu");
  assert.equal(result.channelIntent.formatId, "note");
  assert.equal(result.channelIntent.resolutionState, "resolved");

  const wechat = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
    sources: [{ sourceId: "s1", platform: "youtube", uri: "https://youtube.com/watch?v=1" }],
    explicitTarget: {
      channel: "wechat-article",
      format: "article",
      locale: "zh-CN",
      audience: "开发者",
      goal: "教程",
      taskKind: "original_write",
      requestedAction: "draft",
      accountRef: null
    }
  });
  assert.equal(wechat.sourceContexts[0]?.sourcePlatform, "youtube");
  assert.equal(wechat.channelIntent.channelId, "wechat-article");
  assert.equal(wechat.channelIntent.formatId, "article");
  assert.equal(wechat.channelIntent.channelId === wechat.sourceContexts[0]?.sourcePlatform, false);
});

test("CF-044 ambiguous WeChat request performs no remote call", () => {
  const result = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
    sources: [],
    requestText: "发微信"
  });
  assert.equal(result.channelIntent.resolutionState, "needs_clarification");
  assert.deepEqual(result.channelIntent.candidates, ["wechat-article", "wechat-video", "wechat-chat"]);
  assert.equal(result.remoteCalls, 0);
});

test("CF-044 conflicting target and selected account remain a conflict", () => {
  const result = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "zcode" } }),
    sources: [],
    explicitTarget: {
      channel: "zhihu",
      format: "answer",
      locale: "zh-CN",
      audience: "读者",
      goal: "解答",
      taskKind: "original_write",
      requestedAction: "save_draft",
      accountRef: "wechat-account"
    },
    selectedAccount: { accountRef: "wechat-account", channel: "wechat-article" }
  });
  assert.equal(result.channelIntent.channelId, "zhihu");
  assert.equal(result.channelIntent.resolutionState, "needs_clarification");
  assert.ok(result.channelIntent.resolutionEvidence.includes("target-account-conflict"));
  assert.equal(result.remoteCalls, 0);
});

test("CF-044 normalizes Twitter but does not turn growth podcast or baidu into publishers", () => {
  const twitter = resolvePlatformContext({
    host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "kimi" } }),
    sources: [],
    explicitTarget: {
      channel: "twitter",
      format: "thread",
      locale: "en-US",
      audience: "engineers",
      goal: "explain",
      taskKind: "original_write",
      requestedAction: "export",
      accountRef: null
    }
  });
  assert.equal(twitter.channelIntent.channelId, "x");
  assert.equal(twitter.channelIntent.formatId, "thread");
  assert.equal(twitter.channelIntent.locale, "en-US");

  for (const channel of ["growth", "podcast", "baidu"]) {
    const result = resolvePlatformContext({
      host: probeHost({ env: { CONTENT_FACTORY_HOST_ID: "codex" } }),
      sources: [],
      explicitTarget: {
        channel,
        format: "article",
        locale: "zh-CN",
        audience: null,
        goal: null,
        taskKind: "original_write",
        requestedAction: "draft",
        accountRef: null
      }
    });
    assert.equal(result.channelIntent.channelId, null);
    assert.equal(result.channelIntent.resolutionState, "needs_clarification");
  }
});

test("CF-044 unknown host remains unknown and two short-video targets produce distinct intents", () => {
  const unknownHost = probeHost({ env: { CONTENT_FACTORY_HOST_ID: "mystery" } });
  const douyin = resolvePlatformContext({
    host: unknownHost,
    sources: [{ sourceId: "s1", platform: "local", uri: "file:notes.md" }],
    explicitTarget: {
      channel: "douyin",
      format: "short_video_script",
      locale: "zh-CN",
      audience: "国内用户",
      goal: "演示",
      taskKind: "original_write",
      requestedAction: "export",
      accountRef: null
    }
  });
  const tiktok = resolvePlatformContext({
    host: unknownHost,
    sources: [{ sourceId: "s1", platform: "local", uri: "file:notes.md" }],
    explicitTarget: {
      channel: "tiktok",
      format: "short_video_script",
      locale: "en-US",
      audience: "global users",
      goal: "demo",
      taskKind: "translation",
      requestedAction: "export",
      accountRef: null
    }
  });
  assert.equal(douyin.hostContext.status, "unknown");
  assert.equal(douyin.channelIntent.channelId, "douyin");
  assert.equal(tiktok.channelIntent.channelId, "tiktok");
  assert.notEqual(douyin.channelIntent.locale, tiktok.channelIntent.locale);
});
