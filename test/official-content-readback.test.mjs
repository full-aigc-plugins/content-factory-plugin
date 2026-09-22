import assert from "node:assert/strict";
import test from "node:test";

import { createOfficialContentReadbackApi } from "../adapters/wechat/readback.ts";
import { planDraftUpdate } from "../packages/core/src/delivery/update.ts";
import {
  reconcileUnknownDraft,
  verifyDraftReadback
} from "../packages/core/src/delivery/verify.ts";
import { prepareReleaseBundle } from "../packages/core/src/delivery/prepare.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { manageCloseable, temporaryDirectory } from "../tests/support/temp-directory.ts";

function bundle() {
  return prepareReleaseBundle({
    bundleId: "bundle-1",
    variantRef: "variant-1",
    contentRevisionId: "revision-1",
    packageStatus: "verified",
    targetAccountAlias: "内容平台主账号",
    title: "标题",
    summary: "摘要",
    body: "第一行\n第二行",
    assets: [
      { artifactId: "cover", sha256: "a".repeat(64), order: 0 },
      { artifactId: "inline-1", sha256: "b".repeat(64), order: 1 }
    ],
    detectionReviewRef: "review-1"
  });
}

function remote(overrides = {}) {
  return {
    remoteDraftId: "draft-1",
    title: "标题",
    summary: "摘要",
    body: "第一行\r\n第二行",
    remoteAssetIds: ["remote-cover", "remote-inline-1"],
    ...overrides
  };
}

test("CF-034 exact readback verifies with only declared line-ending normalization", () => {
  const result = verifyDraftReadback({
    bundle: bundle(),
    expectedRemoteAssetIds: ["remote-cover", "remote-inline-1"],
    remoteDraft: remote()
  });

  assert.equal(result.status, "verified");
  assert.deepEqual(result.differences, []);
  assert.equal(result.remoteDraftId, "draft-1");
});

test("CF-034 title, body, and image order changes remain substantive conflicts", () => {
  const result = verifyDraftReadback({
    bundle: bundle(),
    expectedRemoteAssetIds: ["remote-cover", "remote-inline-1"],
    remoteDraft: remote({
      title: "后台改过的标题",
      body: "第二行\n第一行",
      remoteAssetIds: ["remote-inline-1", "remote-cover"]
    })
  });

  assert.equal(result.status, "conflict");
  assert.deepEqual(result.differences.map(item => item.field), [
    "title", "body", "remoteAssetIds"
  ]);
  assert.equal(planDraftUpdate(result).status, "new-approval-required");
});

test("CF-034 unknown write reconciles one matching draft without creating another", async t => {
  const root = await temporaryDirectory(t, "content-factory-readback-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  const frozen = bundle();
  store.createOrLoadDeliverySubmission({
    intentId: "intent-1", bundleHash: frozen.bundleHash,
    accountAlias: frozen.targetAccountAlias, requestId: "request-1",
    status: "unknown", remoteDraftId: null,
    reason: "remote-draft-outcome-unknown",
    createdAt: "2026-09-22T14:00:00.000Z",
    updatedAt: "2026-09-22T14:00:00.000Z"
  });
  store.putDeliveryAssetMap({
    intentId: "intent-1", artifactId: "cover", sha256: "a".repeat(64),
    remoteAssetId: "remote-cover", createdAt: "2026-09-22T14:00:00.000Z"
  });
  store.putDeliveryAssetMap({
    intentId: "intent-1", artifactId: "inline-1", sha256: "b".repeat(64),
    remoteAssetId: "remote-inline-1", createdAt: "2026-09-22T14:00:00.000Z"
  });
  let reads = 0;
  const result = await reconcileUnknownDraft({
    store, intentId: "intent-1", bundle: frozen,
    port: {
      async findByClientRequest(requestId) {
        reads += 1;
        assert.equal(requestId, "request-1");
        return [remote()];
      }
    },
    now: () => "2026-09-22T15:00:00.000Z"
  });

  assert.equal(result.status, "verified");
  assert.equal(reads, 1);
  assert.equal(store.getDeliverySubmission("intent-1")?.status, "succeeded");
  assert.equal(store.getDeliverySubmission("intent-1")?.remoteDraftId, "draft-1");
});

test("CF-034 zero or multiple reconciliation matches remain unknown", async t => {
  const root = await temporaryDirectory(t, "content-factory-readback-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  const frozen = bundle();
  store.createOrLoadDeliverySubmission({
    intentId: "intent-1", bundleHash: frozen.bundleHash,
    accountAlias: frozen.targetAccountAlias, requestId: "request-1",
    status: "unknown", remoteDraftId: null,
    reason: "remote-draft-outcome-unknown",
    createdAt: "2026-09-22T14:00:00.000Z",
    updatedAt: "2026-09-22T14:00:00.000Z"
  });

  const none = await reconcileUnknownDraft({
    store, intentId: "intent-1", bundle: frozen,
    port: { async findByClientRequest() { return []; } }
  });
  const multiple = await reconcileUnknownDraft({
    store, intentId: "intent-1", bundle: frozen,
    port: { async findByClientRequest() { return [remote(), remote({ remoteDraftId: "draft-2" })]; } }
  });

  assert.equal(none.status, "unknown");
  assert.equal(multiple.status, "unknown");
  assert.equal(store.getDeliverySubmission("intent-1")?.status, "unknown");
});

test("CF-034 readback adapter exposes lookup and read only", async () => {
  const api = createOfficialContentReadbackApi({
    async request(action) {
      if (action === "find-drafts") return { drafts: [remote()] };
      return remote();
    }
  });
  assert.equal("createDraft" in api, false);
  assert.equal((await api.findByClientRequest("request-1")).length, 1);
  assert.equal((await api.readDraft("draft-1")).remoteDraftId, "draft-1");
});
