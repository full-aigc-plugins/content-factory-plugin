import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePlatformConstraints } from "../../packages/core/src/channels/constraints.ts";
import { evaluateDetectionApplicability } from "../../packages/core/src/detection/applicability.ts";

const scopedConstraint = {
  constraintId: "article-title-limit",
  kind: "platform-requirement" as const,
  mandatory: true,
  value: { maxCharacters: 64 },
  sourceUrl: "https://docs.example.invalid/article-title",
  checkedAt: "2026-09-01T00:00:00Z",
  validUntil: "2026-10-01T00:00:00Z",
  scope: {
    channelId: "content-platform-article",
    formatId: "article",
    accountAlias: "editorial-main",
    region: "CN",
    action: "draft"
  }
};

const target = {
  channelId: "content-platform-article",
  formatId: "article",
  accountAlias: "editorial-main",
  region: "CN",
  action: "draft" as const
};

test("CF-055 accepts only current, sourced constraints in the exact target scope", () => {
  const result = evaluatePlatformConstraints({
    now: "2026-09-22T08:00:00Z",
    target,
    constraints: [scopedConstraint]
  });
  assert.equal(result.status, "ready");
  assert.deepEqual(result.applicable.map(item => item.constraintId), ["article-title-limit"]);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.remoteActionAllowed, true);
});

test("CF-055 expired mandatory constraint blocks only the affected remote action", () => {
  const result = evaluatePlatformConstraints({
    now: "2026-10-02T00:00:00Z",
    target,
    constraints: [scopedConstraint]
  });
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.blockers, [{
    constraintId: "article-title-limit",
    reason: "mandatory-constraint-expired"
  }]);
  assert.equal(result.remoteActionAllowed, false);
  assert.equal(result.workingExportAllowed, true);
});

test("CF-055 excludes folklore algorithm multipliers from sourced constraints", () => {
  const result = evaluatePlatformConstraints({
    now: "2026-09-22T08:00:00Z",
    target,
    constraints: [{
      ...scopedConstraint,
      constraintId: "engagement-weight",
      kind: "ranking-algorithm-claim" as const,
      value: { saveMultiplier: 3 }
    }]
  });
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.applicable, []);
  assert.deepEqual(result.rejectedClaims, [{
    constraintId: "engagement-weight",
    reason: "unsupported-ranking-algorithm-claim"
  }]);
  assert.equal(result.remoteActionAllowed, false);
});

const detectorPolicy = {
  policyId: "detector-policy-zh-v1",
  providerAlias: "AI 内容检测平台",
  supportedLanguages: ["zh-Hans"],
  supportedInputKinds: ["plain-text"],
  minCharacters: 20,
  maxCharacters: 10_000,
  configuredThreshold: null
};

test("CF-055 unsupported detector language is not_evaluable and never passes", () => {
  const result = evaluateDetectionApplicability({
    policy: detectorPolicy,
    language: "en",
    inputKind: "plain-text",
    finalText: "This final article text is long enough for evaluation.",
    existingReport: null
  });
  assert.deepEqual(result, {
    status: "not_evaluable",
    reason: "unsupported-language",
    finalTextSha256: result.finalTextSha256,
    reusableReport: false,
    threshold: null
  });
});

test("CF-055 changed exact final text invalidates an otherwise applicable report", () => {
  const original = evaluateDetectionApplicability({
    policy: detectorPolicy,
    language: "zh-Hans",
    inputKind: "plain-text",
    finalText: "这是已经冻结并进入检测流程的最终正文，长度足够满足当前检测范围。",
    existingReport: null
  });
  const changed = evaluateDetectionApplicability({
    policy: detectorPolicy,
    language: "zh-Hans",
    inputKind: "plain-text",
    finalText: "这是已经冻结并进入检测流程的最终正文，长度足够满足当前检测范围！",
    existingReport: { finalTextSha256: original.finalTextSha256, policyId: detectorPolicy.policyId }
  });
  assert.equal(original.status, "evaluable");
  assert.equal(changed.status, "evaluable");
  assert.equal(changed.reusableReport, false);
  assert.equal(changed.reason, "final-text-changed");
});

test("CF-055 applicable detection has no invented universal threshold", () => {
  const result = evaluateDetectionApplicability({
    policy: detectorPolicy,
    language: "zh-Hans",
    inputKind: "plain-text",
    finalText: "这是已经冻结并进入检测流程的最终正文，长度足够满足当前检测范围。",
    existingReport: null
  });
  assert.equal(result.status, "evaluable");
  assert.equal(result.threshold, null);
  assert.equal("universalScore" in result, false);
});
