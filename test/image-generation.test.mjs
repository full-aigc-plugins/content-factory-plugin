import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { invokeImageFactory } from "../adapters/image-factory/bridge.ts";

const bytes = Buffer.from("generated-image");
const sha256 = createHash("sha256").update(bytes).digest("hex");

function receipt(requestId = "request-001") {
  return {
    requestId,
    variantRef: "revision-42",
    artifactId: "artifact-001",
    path: "generated/cover.png",
    sha256,
    bytes: bytes.length,
    width: 1200,
    height: 628,
    modelReported: null
  };
}

const brief = {
  briefId: "visual-1",
  revisionId: "revision-42",
  anchor: "cover",
  purpose: "文章封面",
  assetKind: "cover",
  textConstraints: [],
  sourceRefs: [],
  generationStatus: "not-requested"
};

test("CF-021 budget refusal blocks Image Factory without an external call", async () => {
  let submitCalls = 0;
  const result = await invokeImageFactory({
    requestId: "request-001",
    brief,
    capability: { status: "available" },
    approval: { approved: false, budgetRef: null },
    port: {
      async submit() {
        submitCalls += 1;
        return { receipt: receipt(), bytes };
      },
      async reconcile() {
        return null;
      }
    }
  });

  assert.deepEqual(result, {
    status: "blocked",
    reason: "generation-approval-required",
    retry: "never"
  });
  assert.equal(submitCalls, 0);
});

test("CF-021 accepts only a receipt whose request, variant, bytes and hash match", async () => {
  const accepted = await invokeImageFactory({
    requestId: "request-001",
    brief,
    capability: { status: "available" },
    approval: { approved: true, budgetRef: "budget-1" },
    port: {
      async submit() {
        return { receipt: receipt(), bytes };
      },
      async reconcile() {
        return null;
      }
    }
  });

  assert.equal(accepted.status, "succeeded");
  assert.equal(accepted.asset?.sha256, sha256);
  assert.equal(accepted.asset?.modelReported, null);

  const invalid = await invokeImageFactory({
    requestId: "request-001",
    brief,
    capability: { status: "available" },
    approval: { approved: true, budgetRef: "budget-1" },
    port: {
      async submit() {
        return { receipt: { ...receipt(), variantRef: "stale-revision" }, bytes };
      },
      async reconcile() {
        return null;
      }
    }
  });
  assert.deepEqual(invalid, {
    status: "failed",
    reason: "invalid-generation-receipt",
    retry: "never"
  });
});

test("CF-021 reconciles a possibly successful paid request before any retry", async () => {
  let submitCalls = 0;
  let reconcileCalls = 0;
  const result = await invokeImageFactory({
    requestId: "request-001",
    brief,
    capability: { status: "available" },
    approval: { approved: true, budgetRef: "budget-1" },
    port: {
      async submit() {
        submitCalls += 1;
        throw Object.assign(new Error("response lost"), { outcomeUnknown: true });
      },
      async reconcile(requestId) {
        reconcileCalls += 1;
        assert.equal(requestId, "request-001");
        return { receipt: receipt(requestId), bytes };
      }
    }
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.reconciled, true);
  assert.equal(submitCalls, 1);
  assert.equal(reconcileCalls, 1);
});
