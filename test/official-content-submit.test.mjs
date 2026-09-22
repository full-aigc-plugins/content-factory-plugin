import assert from "node:assert/strict";
import test from "node:test";

import { createOfficialContentDraftApi } from "../adapters/wechat/api.ts";
import { approveDeliveryIntent } from "../packages/core/src/delivery/approve.ts";
import { createDeliveryIntent } from "../packages/core/src/delivery/intents.ts";
import { prepareReleaseBundle } from "../packages/core/src/delivery/prepare.ts";
import { submitApprovedDraft } from "../packages/core/src/delivery/submit.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { manageCloseable, temporaryDirectory } from "../tests/support/temp-directory.ts";

test("CF-033 channel adapter exposes draft creation but no publish action", async () => {
  const actions = [];
  const api = createOfficialContentDraftApi({
    async request(action, payload) {
      actions.push([action, payload]);
      if (action === "asset-upload") return { remoteAssetId: "remote-cover" };
      return { remoteDraftId: "draft-1" };
    }
  });

  assert.equal("publish" in api, false);
  assert.deepEqual(await api.uploadAsset({ artifactId: "cover", sha256: "a".repeat(64) }), {
    remoteAssetId: "remote-cover"
  });
  assert.deepEqual(await api.createDraft({
    title: "标题", summary: "摘要", body: "正文", remoteAssetIds: ["remote-cover"]
  }), { remoteDraftId: "draft-1" });
  assert.deepEqual(actions.map(item => item[0]), ["asset-upload", "draft-create"]);
});

async function setup(t) {
  const root = await temporaryDirectory(t, "content-factory-submit-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  const bundle = prepareReleaseBundle({
    bundleId: "bundle-1",
    variantRef: "variant-1",
    contentRevisionId: "revision-1",
    packageStatus: "verified",
    targetAccountAlias: "内容平台主账号",
    title: "标题",
    summary: "摘要",
    body: "正文",
    assets: [
      { artifactId: "cover", sha256: "a".repeat(64), order: 0 },
      { artifactId: "inline-1", sha256: "b".repeat(64), order: 1 }
    ],
    detectionReviewRef: "review-1"
  });
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle,
    preflight: {
      status: "ready",
      accountAlias: "内容平台主账号",
      deliveryMethod: "api-draft"
    }
  });
  const approval = approveDeliveryIntent({
    intent,
    actor: { kind: "human", id: "editor-1" },
    interactionTrusted: true,
    approvedAt: "2026-09-22T14:00:00.000Z"
  });
  return { store, bundle, intent, approval };
}

test("CF-033 persists submission intent before the first remote asset call", async t => {
  const context = await setup(t);
  let checked = false;
  const result = await submitApprovedDraft({
    ...context,
    requestId: "request-1",
    port: {
      async uploadAsset(asset) {
        const persisted = context.store.getDeliverySubmission("intent-1");
        assert.equal(persisted?.status, "submitting");
        assert.equal(persisted?.bundleHash, context.bundle.bundleHash);
        checked = true;
        return { remoteAssetId: `remote-${asset.artifactId}` };
      },
      async createDraft(input) {
        assert.deepEqual(input.remoteAssetIds, ["remote-cover", "remote-inline-1"]);
        return { remoteDraftId: "draft-1" };
      }
    }
  });

  assert.equal(checked, true);
  assert.equal(result.status, "succeeded");
  assert.equal(result.remoteDraftId, "draft-1");
  assert.equal(result.action, "draft-created");
});

test("CF-033 resumes partial asset uploads without uploading completed assets again", async t => {
  const context = await setup(t);
  const uploads = [];
  let failInline = true;
  const port = {
    async uploadAsset(asset) {
      uploads.push(asset.artifactId);
      if (asset.artifactId === "inline-1" && failInline) {
        failInline = false;
        throw new Error("synthetic upload failure");
      }
      return { remoteAssetId: `remote-${asset.artifactId}` };
    },
    async createDraft() { return { remoteDraftId: "draft-1" }; }
  };

  const first = await submitApprovedDraft({ ...context, requestId: "request-1", port });
  const second = await submitApprovedDraft({ ...context, requestId: "request-1", port });

  assert.equal(first.status, "failed");
  assert.equal(second.status, "succeeded");
  assert.deepEqual(uploads, ["cover", "inline-1", "inline-1"]);
  assert.equal(context.store.getDeliveryAssetMap("intent-1", "cover")?.remoteAssetId, "remote-cover");
});

test("CF-033 draft timeout becomes unknown and repeated submit never creates another draft", async t => {
  const context = await setup(t);
  let draftCalls = 0;
  const port = {
    async uploadAsset(asset) { return { remoteAssetId: `remote-${asset.artifactId}` }; },
    async createDraft() {
      draftCalls += 1;
      throw Object.assign(new Error("response lost"), { outcomeUnknown: true });
    }
  };

  const first = await submitApprovedDraft({ ...context, requestId: "request-timeout", port });
  const repeated = await submitApprovedDraft({ ...context, requestId: "request-timeout", port });

  assert.equal(first.status, "unknown");
  assert.equal(repeated.status, "unknown");
  assert.equal(repeated.reason, "remote-draft-outcome-unknown");
  assert.equal(draftCalls, 1);
});

test("CF-033 successful duplicate submit is locally deduplicated", async t => {
  const context = await setup(t);
  let remoteCalls = 0;
  const port = {
    async uploadAsset(asset) {
      remoteCalls += 1;
      return { remoteAssetId: `remote-${asset.artifactId}` };
    },
    async createDraft() {
      remoteCalls += 1;
      return { remoteDraftId: "draft-1" };
    }
  };

  const first = await submitApprovedDraft({ ...context, requestId: "request-1", port });
  const second = await submitApprovedDraft({ ...context, requestId: "request-1", port });

  assert.equal(first.status, "succeeded");
  assert.equal(second.status, "succeeded");
  assert.equal(second.deduplicated, true);
  assert.equal(second.remoteDraftId, "draft-1");
  assert.equal(remoteCalls, 3);
});
