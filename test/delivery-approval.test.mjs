import assert from "node:assert/strict";
import test from "node:test";

import { approveDeliveryIntent, validateApprovedDelivery } from "../packages/core/src/delivery/approve.ts";
import { createDeliveryIntent } from "../packages/core/src/delivery/intents.ts";
import { prepareReleaseBundle } from "../packages/core/src/delivery/prepare.ts";

function bundle(overrides = {}) {
  return prepareReleaseBundle({
    bundleId: "bundle-1",
    variantRef: "variant-1",
    contentRevisionId: "revision-1",
    packageStatus: "verified",
    targetAccountAlias: "内容平台主账号",
    title: "标题",
    summary: "摘要",
    body: "正文",
    assets: [{
      artifactId: "cover-1",
      sha256: "a".repeat(64),
      order: 0
    }],
    detectionReviewRef: "review-1",
    ...overrides
  });
}

test("CF-032 bundle hash binds logical content, asset order, and target account", () => {
  const original = bundle();
  const same = bundle();
  const changedBody = bundle({ body: "正文已改" });
  const changedCover = bundle({ assets: [{
    artifactId: "cover-2", sha256: "b".repeat(64), order: 0
  }] });
  const changedAccount = bundle({ targetAccountAlias: "内容平台备用账号" });

  assert.equal(original.bundleHash, same.bundleHash);
  assert.notEqual(original.bundleHash, changedBody.bundleHash);
  assert.notEqual(original.bundleHash, changedCover.bundleHash);
  assert.notEqual(original.bundleHash, changedAccount.bundleHash);
});

test("CF-032 working package cannot create a verified delivery intent", () => {
  const working = bundle({ packageStatus: "working" });
  assert.throws(
    () => createDeliveryIntent({
      intentId: "intent-1",
      bundle: working,
      preflight: {
        status: "ready",
        accountAlias: "内容平台主账号",
        deliveryMethod: "api-draft"
      }
    }),
    error => error?.code === "DELIVERY_BUNDLE_NOT_VERIFIED"
  );
});

test("CF-032 without trusted approval channel stops at prepared intent", () => {
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle: bundle(),
    preflight: {
      status: "ready",
      accountAlias: "内容平台主账号",
      deliveryMethod: "api-draft"
    }
  });

  assert.equal(intent.status, "prepared");
  assert.equal(intent.remoteWriteAuthorized, false);
  assert.equal(intent.bundleHash, bundle().bundleHash);
});

test("CF-032 rejects model self-approval and untrusted interaction", () => {
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle: bundle(),
    preflight: {
      status: "ready",
      accountAlias: "内容平台主账号",
      deliveryMethod: "api-draft"
    }
  });

  assert.throws(
    () => approveDeliveryIntent({
      intent,
      actor: { kind: "model", id: "writer-model" },
      interactionTrusted: true,
      approvedAt: "2026-09-22T13:30:00.000Z"
    }),
    error => error?.code === "DELIVERY_APPROVAL_ACTOR_UNTRUSTED"
  );
  assert.throws(
    () => approveDeliveryIntent({
      intent,
      actor: { kind: "human", id: "editor-1" },
      interactionTrusted: false,
      approvedAt: "2026-09-22T13:30:00.000Z"
    }),
    error => error?.code === "DELIVERY_APPROVAL_CHANNEL_UNTRUSTED"
  );
});

test("CF-032 approval is invalid after body, asset, or account replacement", () => {
  const frozen = bundle();
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle: frozen,
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
    approvedAt: "2026-09-22T13:30:00.000Z"
  });

  assert.deepEqual(validateApprovedDelivery({ intent, approval, currentBundle: frozen }), {
    allowed: true,
    reason: null
  });
  assert.equal(validateApprovedDelivery({
    intent, approval, currentBundle: bundle({ body: "正文替换" })
  }).reason, "bundle-changed-after-approval");
  assert.equal(validateApprovedDelivery({
    intent, approval, currentBundle: bundle({ targetAccountAlias: "内容平台备用账号" })
  }).reason, "bundle-changed-after-approval");
});
