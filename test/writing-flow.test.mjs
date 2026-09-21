import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptVendorDraft,
  prepareWritingRequest
} from "../adapters/content-methods/write.ts";

const brief = {
  mode: "full",
  topic: "Content Factory",
  contentRef: null,
  sourceRefs: ["s1"],
  channel: "wechat-article",
  accountRef: null,
  locale: "zh-CN",
  audience: "工程团队",
  goal: "解释能力边界",
  missingInputs: [],
  assumptions: []
};

const claimRegistry = {
  mode: "materials-only",
  conflicts: [],
  claims: [{
    claimId: "c1",
    statement: "Node.js 24 is the runtime baseline.",
    kind: "verifiable",
    evidence: [{ sourceId: "s1", locator: "architecture:runtime" }],
    verification: "source-backed",
    independentlyPublicVerified: true
  }]
};

const expectedSections = {
  "research-analysis": ["Summary", "Evidence", "Analysis", "Limitations"],
  "technical-tutorial": ["Problem", "Environment", "Steps", "Verification", "Trade-offs"],
  "product-update": ["What changed", "Why it matters", "How to use", "Limitations"],
  "customer-case": ["Context", "Problem", "Approach", "Outcome", "Lessons"],
  "short-social-script": ["Hook", "Value", "Proof", "Close"]
};

for (const [contentType, sections] of Object.entries(expectedSections)) {
  test(`CF-016 ${contentType} selects a structure appropriate to its content type`, () => {
    const request = prepareWritingRequest({
      contentType,
      brief,
      claimRegistry,
      caseFacts: contentType === "customer-case"
        ? { customer: "Example School", problem: "manual workflow", outcome: "verified pilot completed" }
        : undefined
    });

    assert.deepEqual(request.outlineRevision.sections, sections);
    assert.equal(request.outlineRevision.source, "template");
    assert.equal(request.draftRequest.claims[0].statement, claimRegistry.claims[0].statement);
  });
}

test("CF-016 preserves an explicit user outline instead of replacing it with a template", () => {
  const userOutline = ["现状", "约束", "方案", "验收"];
  const request = prepareWritingRequest({
    contentType: "technical-tutorial",
    brief,
    claimRegistry,
    userOutline
  });

  assert.deepEqual(request.outlineRevision.sections, userOutline);
  assert.equal(request.outlineRevision.source, "user");
});

test("CF-016 customer case reports missing outcome evidence instead of inventing a percentage", () => {
  const request = prepareWritingRequest({
    contentType: "customer-case",
    brief,
    claimRegistry,
    caseFacts: {
      customer: "Example School",
      problem: "manual workflow"
    }
  });

  assert.ok(request.missingInputs.includes("case_outcome"));
  assert.equal(JSON.stringify(request).includes("%"), false);
  assert.equal(request.draftRequest.instructions.some(text => /invent/i.test(text)), true);
});

test("CF-016 vendor candidate becomes a draft revision only with the requested outline identity", () => {
  const request = prepareWritingRequest({
    contentType: "research-analysis",
    brief,
    claimRegistry
  });
  const draft = acceptVendorDraft(request, {
    outlineFingerprint: request.outlineRevision.fingerprint,
    text: "Summary\nEvidence\nAnalysis\nLimitations",
    vendorMethod: "content-research-writer"
  });

  assert.equal(draft.kind, "draft");
  assert.equal(draft.vendorMethod, "content-research-writer");
  assert.equal(draft.outlineFingerprint, request.outlineRevision.fingerprint);

  assert.throws(
    () => acceptVendorDraft(request, {
      outlineFingerprint: "wrong",
      text: "candidate",
      vendorMethod: "content-research-writer"
    }),
    error => error?.code === "WRITING_OUTLINE_MISMATCH"
  );
});
