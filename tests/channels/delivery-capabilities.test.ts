import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeChannelAction,
  type ChannelDeliveryCapability
} from "../../packages/core/src/delivery/capabilities.ts";

const articleCapability: ChannelDeliveryCapability = {
  capabilityId: "content-platform-article-draft-v1",
  channelId: "wechat-article",
  formatIds: ["article", "image_text"],
  accountAlias: "内容平台主账号",
  adapterId: "content-platform-article-adapter",
  actions: ["read", "export", "draft"],
  contractVerified: true,
  liveVerified: true
};

const approval = {
  actorKind: "human" as const,
  trusted: true,
  channelId: "wechat-article",
  formatId: "article",
  accountAlias: "内容平台主账号",
  action: "draft" as const,
  bundleHash: "a".repeat(64)
};

test("CF-053 exact draft capability requires matching trusted approval and retains recovery gates", () => {
  const decision = authorizeChannelAction({
    capability: articleCapability,
    request: {
      channelId: "wechat-article",
      formatId: "article",
      accountAlias: "内容平台主账号",
      adapterId: "content-platform-article-adapter",
      action: "draft",
      bundleHash: "a".repeat(64)
    },
    approval
  });
  assert.deepEqual(decision, {
    status: "allowed",
    action: "draft",
    remoteWrite: true,
    requiresReadback: true,
    requiresUnknownWriteReconciliation: true,
    workingExportAllowed: true
  });
});

test("CF-053 read permission never authorizes publish and performs no remote call", () => {
  let remoteCalls = 0;
  const decision = authorizeChannelAction({
    capability: { ...articleCapability, actions: ["read"] },
    request: {
      channelId: "wechat-article",
      formatId: "article",
      accountAlias: "内容平台主账号",
      adapterId: "content-platform-article-adapter",
      action: "publish",
      bundleHash: "a".repeat(64)
    },
    approval: { ...approval, action: "publish" },
    executeRemote() {
      remoteCalls += 1;
    }
  });
  assert.equal(decision.status, "blocked");
  assert.equal(decision.reason, "action-not-granted");
  assert.equal(decision.workingExportAllowed, true);
  assert.equal(remoteCalls, 0);
});

test("CF-053 article adapter cannot serve an adjacent video channel", () => {
  const decision = authorizeChannelAction({
    capability: articleCapability,
    request: {
      channelId: "wechat-video",
      formatId: "caption",
      accountAlias: "内容平台主账号",
      adapterId: "content-platform-article-adapter",
      action: "draft",
      bundleHash: "a".repeat(64)
    },
    approval: { ...approval, channelId: "wechat-video", formatId: "caption" }
  });
  assert.equal(decision.status, "blocked");
  assert.equal(decision.reason, "channel-not-granted");
});

test("CF-053 mismatched account format adapter bundle or model approval blocks before write", () => {
  const mutations = [
    { request: { accountAlias: "内容平台备用账号" }, reason: "account-not-granted" },
    { request: { formatId: "video_script" }, reason: "format-not-granted" },
    { request: { adapterId: "another-adapter" }, reason: "adapter-not-granted" },
    { request: { bundleHash: "b".repeat(64) }, reason: "approval-mismatch" },
    { approval: { actorKind: "agent" as const }, reason: "human-approval-required" }
  ];
  for (const mutation of mutations) {
    const decision = authorizeChannelAction({
      capability: articleCapability,
      request: {
        channelId: "wechat-article",
        formatId: "article",
        accountAlias: "内容平台主账号",
        adapterId: "content-platform-article-adapter",
        action: "draft",
        bundleHash: "a".repeat(64),
        ...mutation.request
      },
      approval: { ...approval, ...mutation.approval }
    });
    assert.equal(decision.status, "blocked");
    assert.equal(decision.reason, mutation.reason);
  }
});

test("CF-053 local export is non-remote and needs no delivery approval", () => {
  const decision = authorizeChannelAction({
    capability: articleCapability,
    request: {
      channelId: "wechat-article",
      formatId: "article",
      accountAlias: "内容平台主账号",
      adapterId: "content-platform-article-adapter",
      action: "export",
      bundleHash: "a".repeat(64)
    },
    approval: null
  });
  assert.equal(decision.status, "allowed");
  assert.equal(decision.remoteWrite, false);
  assert.equal(decision.requiresReadback, false);
});

test("CF-053 unverified remote capability falls back to working export", () => {
  const decision = authorizeChannelAction({
    capability: { ...articleCapability, liveVerified: false },
    request: {
      channelId: "wechat-article",
      formatId: "article",
      accountAlias: "内容平台主账号",
      adapterId: "content-platform-article-adapter",
      action: "draft",
      bundleHash: "a".repeat(64)
    },
    approval
  });
  assert.equal(decision.status, "blocked");
  assert.equal(decision.reason, "capability-not-live-verified");
  assert.equal(decision.workingExportAllowed, true);
});
