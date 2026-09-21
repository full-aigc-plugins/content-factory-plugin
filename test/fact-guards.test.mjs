import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeProtectedFacts,
  createReviewReport,
  recordHumanReviewDecision
} from "../packages/core/src/review/facts.ts";

test("CF-017 flags changed numbers, percentages, units, negation and time ranges", () => {
  const findings = analyzeProtectedFacts(
    "2024-2025 年延迟不超过 120 ms，成功率 98%。",
    "2024-2026 年延迟超过 150 s，成功率 99%。"
  );

  const kinds = new Set(findings.map(item => item.kind));
  assert.ok(kinds.has("number"));
  assert.ok(kinds.has("percentage"));
  assert.ok(kinds.has("unit"));
  assert.ok(kinds.has("negation"));
  assert.ok(kinds.has("time-range"));
  assert.equal(findings.every(item => item.before !== item.after), true);
});

test("CF-017 reports command and URL changes exactly instead of silently accepting them", () => {
  const findings = analyzeProtectedFacts(
    "运行 `npm run build`，然后访问 https://example.com/v1 。",
    "运行 `npm run release`，然后访问 https://example.com/v2 。"
  );

  assert.deepEqual(
    findings.filter(item => item.kind === "command").map(item => [item.before, item.after]),
    [["npm run build", "npm run release"]]
  );
  assert.deepEqual(
    findings.filter(item => item.kind === "url").map(item => [item.before, item.after]),
    [["https://example.com/v1", "https://example.com/v2"]]
  );
});

test("CF-017 invalid citation binding blocks verified delivery independently of semantic review", () => {
  const report = createReviewReport({
    before: "事实 A。[s1:paragraph:4]",
    after: "事实 A。[s2:paragraph:9]",
    citationBindings: [{
      claimId: "c1",
      expectedSourceId: "s1",
      expectedLocator: "paragraph:4",
      actualSourceId: "s2",
      actualLocator: "paragraph:9"
    }],
    semanticReview: {
      status: "pass",
      notes: ["表达清晰"]
    }
  });

  assert.equal(report.semanticReview.status, "pass");
  assert.equal(report.deliveryEligible, false);
  assert.ok(report.deterministicFindings.some(item => item.kind === "citation-target"));
});

test("CF-017 human decision and reason are retained without deleting deterministic findings", () => {
  const report = createReviewReport({
    before: "延迟 120 ms。",
    after: "延迟 150 ms。",
    citationBindings: [],
    semanticReview: { status: "needs-review", notes: [] }
  });
  const reviewed = recordHumanReviewDecision(report, {
    decision: "accepted_with_exception",
    reason: "数据源已更新，但正式交付前仍需更新引用"
  });

  assert.equal(reviewed.humanDecision?.decision, "accepted_with_exception");
  assert.equal(reviewed.humanDecision?.reason.includes("数据源已更新"), true);
  assert.ok(reviewed.deterministicFindings.length > 0);
  assert.equal(reviewed.deliveryEligible, false);
});
