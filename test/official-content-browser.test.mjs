import assert from "node:assert/strict";
import test from "node:test";

import { runControlledDraftBrowser } from "../adapters/wechat/browser.ts";
import { approveDeliveryIntent } from "../packages/core/src/delivery/approve.ts";
import { createDeliveryIntent } from "../packages/core/src/delivery/intents.ts";
import { prepareReleaseBundle } from "../packages/core/src/delivery/prepare.ts";

function delivery() {
  const bundle = prepareReleaseBundle({
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
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle,
    preflight: {
      status: "ready",
      accountAlias: bundle.targetAccountAlias,
      deliveryMethod: "api-draft"
    }
  });
  const approval = approveDeliveryIntent({
    intent,
    actor: { kind: "human", id: "editor-1" },
    interactionTrusted: true,
    approvedAt: "2026-09-22T16:00:00.000Z"
  });
  return { bundle, intent, approval };
}

function browserPort(overrides = {}) {
  const events = [];
  return {
    events,
    port: {
      async inspectSession(input) {
        events.push(["inspect", input]);
        return {
          status: "ready",
          accountAlias: "内容平台主账号",
          evidenceRef: "session-evidence"
        };
      },
      async fillDraft(input) {
        events.push(["fill", input]);
        return { status: "filled", evidenceRef: "filled-evidence" };
      },
      async saveDraft(input) {
        events.push(["save", input]);
        return {
          status: "saved",
          remoteDraftId: "draft-1",
          evidenceRef: "saved-evidence"
        };
      },
      async readDraft(input) {
        events.push(["read", input]);
        return {
          remoteDraftId: "draft-1",
          title: "标题",
          summary: "摘要",
          body: "第一行\r\n第二行",
          remoteAssetIds: ["remote-cover", "remote-inline-1"]
        };
      },
      ...overrides
    }
  };
}

function request(port, overrides = {}) {
  return {
    ...delivery(),
    selectedAccountAlias: "内容平台主账号",
    action: "save-draft",
    capability: { status: "available", browserName: "user-selected" },
    operatingSystem: { name: "darwin", status: "supported" },
    expectedRemoteAssetIds: ["remote-cover", "remote-inline-1"],
    port,
    ...overrides
  };
}

test("CF-035 expired login and verification challenge stop before filling", async () => {
  for (const status of ["expired", "verification-required"]) {
    const fake = browserPort({
      async inspectSession(input) {
        fake.events.push(["inspect", input]);
        return {
          status,
          accountAlias: "内容平台主账号",
          evidenceRef: `${status}-evidence`
        };
      }
    });

    const result = await runControlledDraftBrowser(request(fake.port));

    assert.equal(result.status, "recoverable");
    assert.equal(result.reason, status);
    assert.deepEqual(fake.events.map(([name]) => name), ["inspect"]);
    assert.deepEqual(result.evidence, []);
  }
});

test("CF-035 editor structure drift is recoverable and never saves", async () => {
  const fake = browserPort({
    async fillDraft(input) {
      fake.events.push(["fill", input]);
      return { status: "editor-structure-changed", evidenceRef: "dom-drift" };
    }
  });

  const result = await runControlledDraftBrowser(request(fake.port));

  assert.equal(result.status, "recoverable");
  assert.equal(result.reason, "editor-structure-changed");
  assert.deepEqual(fake.events.map(([name]) => name), ["inspect", "fill"]);
  assert.deepEqual(result.evidence, []);
});

test("CF-035 saved draft without readback stays saved rather than verified", async () => {
  const fake = browserPort({
    async readDraft(input) {
      fake.events.push(["read", input]);
      return null;
    }
  });

  const result = await runControlledDraftBrowser(request(fake.port));

  assert.equal(result.status, "saved");
  assert.equal(result.reason, "readback-unavailable");
  assert.equal(result.remoteDraftId, "draft-1");
  assert.deepEqual(result.evidence.map(item => item.phase), ["filled", "saved"]);
});

test("CF-035 exact readback records filled, saved, and verified evidence", async () => {
  const fake = browserPort();

  const result = await runControlledDraftBrowser(request(fake.port));

  assert.equal(result.status, "verified");
  assert.equal(result.reason, null);
  assert.equal(result.remoteDraftId, "draft-1");
  assert.deepEqual(result.evidence.map(item => item.phase), [
    "filled", "saved", "verified"
  ]);
  assert.deepEqual(fake.events.map(([name]) => name), [
    "inspect", "fill", "save", "read"
  ]);
});

test("CF-035 conflicting readback cannot be reported as verified", async () => {
  const fake = browserPort({
    async readDraft(input) {
      fake.events.push(["read", input]);
      return {
        remoteDraftId: "draft-1",
        title: "后台改过的标题",
        summary: "摘要",
        body: "第一行\n第二行",
        remoteAssetIds: ["remote-inline-1", "remote-cover"]
      };
    }
  });

  const result = await runControlledDraftBrowser(request(fake.port));

  assert.equal(result.status, "conflict");
  assert.equal(result.reason, "readback-conflict");
  assert.deepEqual(result.differences.map(item => item.field), [
    "title", "remoteAssetIds"
  ]);
  assert.deepEqual(result.evidence.map(item => item.phase), ["filled", "saved"]);
});

test("CF-035 capability, OS, account, approval, and action gates precede browser access", async () => {
  const cases = [
    {
      overrides: { capability: { status: "unavailable", browserName: null } },
      reason: "browser-capability-unavailable"
    },
    {
      overrides: { operatingSystem: { name: "unknown-os", status: "unsupported" } },
      reason: "operating-system-unsupported"
    },
    {
      overrides: { selectedAccountAlias: "内容平台备用账号" },
      reason: "selected-account-mismatch"
    },
    {
      overrides: { action: "publish" },
      reason: "unsupported-browser-action"
    },
    {
      overrides: { bundle: prepareReleaseBundle({
        ...delivery().bundle,
        body: "审批后被替换的正文"
      }) },
      reason: "bundle-changed-after-approval"
    }
  ];

  for (const item of cases) {
    const fake = browserPort();
    const result = await runControlledDraftBrowser(
      request(fake.port, item.overrides)
    );
    assert.equal(result.status, "blocked");
    assert.equal(result.reason, item.reason);
    assert.deepEqual(fake.events, []);
  }
});

test("CF-035 active session for another account stops without filling", async () => {
  const fake = browserPort({
    async inspectSession(input) {
      fake.events.push(["inspect", input]);
      return {
        status: "ready",
        accountAlias: "内容平台备用账号",
        evidenceRef: "wrong-account-evidence"
      };
    }
  });

  const result = await runControlledDraftBrowser(request(fake.port));

  assert.equal(result.status, "recoverable");
  assert.equal(result.reason, "active-account-mismatch");
  assert.deepEqual(fake.events.map(([name]) => name), ["inspect"]);
});
