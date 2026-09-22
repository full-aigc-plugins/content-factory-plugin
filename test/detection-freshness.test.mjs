import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDetectionRequestKey,
  evaluateDetectionFreshness
} from "../packages/core/src/detection/freshness.ts";
import { planDetectionInvalidation } from "../packages/core/src/workflow/invalidation.ts";

const binding = {
  runId: "run-1",
  textHash: "a".repeat(64),
  canonicalizationVersion: "1",
  requestConfigHash: "b".repeat(64),
  presentationHash: "c".repeat(64),
  accountRef: "account-a",
  providerModelVersion: null,
  createdAt: "2026-09-22T10:00:00.000Z",
  expiresAt: "2026-09-22T12:00:00.000Z"
};

test("CF-028 reuses only an exact fresh binding inside the same run", () => {
  const result = evaluateDetectionFreshness({
    binding,
    current: { ...binding },
    now: "2026-09-22T11:00:00.000Z"
  });

  assert.equal(result.detectionReusable, true);
  assert.equal(result.deliveryReviewRequired, false);
  assert.deepEqual(result.reasons, []);
});

test("CF-028 title or summary text change invalidates detection and approval", () => {
  const result = planDetectionInvalidation({
    binding,
    current: { ...binding, textHash: "d".repeat(64) },
    now: "2026-09-22T11:00:00.000Z"
  });

  assert.equal(result.detectionReusable, false);
  assert.equal(result.approvalReusable, false);
  assert.deepEqual(result.todos, ["redetect", "review-detection", "review-delivery"]);
  assert.ok(result.reasons.includes("canonical-text-changed"));
});

test("CF-028 CSS-only change may reuse detection but requires delivery review", () => {
  const result = planDetectionInvalidation({
    binding,
    current: { ...binding, presentationHash: "e".repeat(64) },
    now: "2026-09-22T11:00:00.000Z"
  });

  assert.equal(result.detectionReusable, true);
  assert.equal(result.approvalReusable, true);
  assert.equal(result.deliveryReviewRequired, true);
  assert.deepEqual(result.todos, ["review-delivery"]);
  assert.ok(result.reasons.includes("presentation-changed"));
});

test("CF-028 cross-run and expired reports require explicit redetection", () => {
  const crossRun = evaluateDetectionFreshness({
    binding,
    current: { ...binding, runId: "run-2" },
    now: "2026-09-22T11:00:00.000Z"
  });
  const expired = evaluateDetectionFreshness({
    binding,
    current: { ...binding },
    now: "2026-09-22T12:00:00.000Z"
  });

  assert.equal(crossRun.detectionReusable, false);
  assert.ok(crossRun.reasons.includes("cross-run-reuse-denied"));
  assert.equal(expired.detectionReusable, false);
  assert.ok(expired.reasons.includes("report-expired"));
});

test("CF-028 deduplication key includes run, text, canonicalization and request config", () => {
  const first = buildDetectionRequestKey(binding);
  const same = buildDetectionRequestKey({ ...binding });
  const changedConfig = buildDetectionRequestKey({
    ...binding,
    requestConfigHash: "f".repeat(64)
  });
  const changedRun = buildDetectionRequestKey({ ...binding, runId: "run-2" });

  assert.equal(first, same);
  assert.notEqual(first, changedConfig);
  assert.notEqual(first, changedRun);
  assert.match(first, /^[0-9a-f]{64}$/);
});
