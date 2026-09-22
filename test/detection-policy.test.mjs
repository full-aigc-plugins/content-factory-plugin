import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_DETECTION_POLICY,
  evaluateDetectionPolicy
} from "../packages/core/src/detection/policy.ts";
import { recordDetectionReview } from "../packages/core/src/review/approval.ts";

const evaluableReport = {
  status: "evaluable",
  classification: {
    aiRatio: 0.31,
    suspectedRatio: 0.12,
    confidence: 0.88
  },
  issues: []
};

test("CF-027 defaults to review and does not invent an unconfigured threshold", () => {
  const result = evaluateDetectionPolicy({
    policy: DEFAULT_DETECTION_POLICY,
    detectionStatus: "succeeded",
    report: evaluableReport
  });

  assert.equal(result.verdict, "review-required");
  assert.equal(result.thresholds, null);
  assert.equal(result.policyVersion, "1");
});

test("CF-027 request failure and unknown report fields can never pass policy", () => {
  const thresholdPolicy = {
    version: "threshold-v1",
    mode: "threshold",
    maxAiRatio: 0.4,
    maxSuspectedRatio: 0.2,
    minConfidence: 0.5
  };
  const failed = evaluateDetectionPolicy({
    policy: thresholdPolicy,
    detectionStatus: "failed",
    report: evaluableReport
  });
  const unknown = evaluateDetectionPolicy({
    policy: thresholdPolicy,
    detectionStatus: "succeeded",
    report: {
      status: "not-evaluable",
      classification: {
        aiRatio: null,
        suspectedRatio: null,
        confidence: null
      },
      issues: ["unknown-provider-field"]
    }
  });

  assert.equal(failed.verdict, "not-evaluable");
  assert.equal(unknown.verdict, "not-evaluable");
});

test("CF-027 human exception preserves a not-met policy verdict", () => {
  const evaluated = evaluateDetectionPolicy({
    policy: {
      version: "threshold-v1",
      mode: "threshold",
      maxAiRatio: 0.2,
      maxSuspectedRatio: 0.1,
      minConfidence: 0.5
    },
    detectionStatus: "succeeded",
    report: evaluableReport
  });
  assert.equal(evaluated.verdict, "not-met");

  const reviewed = recordDetectionReview({
    policyVerdict: evaluated,
    actor: { kind: "human", id: "editor-17" },
    action: "accept-exception",
    reason: "人工复核后接受当前版本",
    policyVersion: "threshold-v1",
    decidedAt: "2026-09-22T11:00:00.000Z"
  });

  assert.equal(reviewed.policyVerdict.verdict, "not-met");
  assert.equal(reviewed.reviewDecision.action, "accept-exception");
  assert.equal(reviewed.reviewDecision.actorId, "editor-17");
});

test("CF-027 rejects model self-approval and mismatched policy versions", () => {
  const result = evaluateDetectionPolicy({
    policy: DEFAULT_DETECTION_POLICY,
    detectionStatus: "succeeded",
    report: evaluableReport
  });

  assert.throws(
    () => recordDetectionReview({
      policyVerdict: result,
      actor: { kind: "model", id: "writer-model" },
      action: "approve",
      reason: "self approved",
      policyVersion: "1",
      decidedAt: "2026-09-22T11:00:00.000Z"
    }),
    error => error?.code === "DETECTION_REVIEW_ACTOR_UNTRUSTED"
  );
  assert.throws(
    () => recordDetectionReview({
      policyVerdict: result,
      actor: { kind: "human", id: "editor-17" },
      action: "approve",
      reason: "reviewed",
      policyVersion: "stale-policy",
      decidedAt: "2026-09-22T11:00:00.000Z"
    }),
    error => error?.code === "DETECTION_POLICY_VERSION_MISMATCH"
  );
});

test("CF-027 policy schema makes review the default and forbids unknown fields", async () => {
  const schema = JSON.parse(await readFile(
    new URL("../schemas/detection-policy.schema.json", import.meta.url),
    "utf8"
  ));

  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.mode.enum, ["review", "threshold"]);
  assert.equal(schema.properties.mode.default, "review");
  assert.ok(schema.allOf.some(rule => rule.then?.required?.includes("maxAiRatio")));
});
