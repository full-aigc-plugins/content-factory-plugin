import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptEditedCandidate,
  prepareEditRequest
} from "../adapters/content-methods/edit.ts";

const profile = {
  profileId: "author",
  revision: 1,
  style: { tone: ["clear", "specific"], sentenceRhythm: "balanced", averageSentenceLength: 18 },
  protectedTerms: ["Content Factory", "ms"],
  blockedPhrases: ["赋能"],
  sourceSampleCount: 1,
  fingerprint: "a".repeat(64)
};

test("CF-018 defaults to standard editing and carries only style constraints, not conversation history", () => {
  const request = prepareEditRequest({
    text: "Content Factory 延迟为 120 ms。",
    profile,
    round: 0
  });

  assert.equal(request.intensity, "standard");
  assert.deepEqual(request.style.tone, ["clear", "specific"]);
  assert.equal("conversationHistory" in request, false);
  assert.ok(request.instructions.some(item => item.includes("Do not invent")));
});

test("CF-018 blocks fabricated first-person experience and zero-width obfuscation", () => {
  const request = prepareEditRequest({
    text: "Content Factory 用于内容生产。",
    profile,
    round: 0
  });

  const fabricated = acceptEditedCandidate(request, {
    text: "我曾亲自为 100 家客户部署 Content Factory。",
    reasons: ["增强真实感"],
    vendorMethod: "humanizer"
  });
  assert.equal(fabricated.status, "review-required");
  assert.ok(fabricated.findings.some(item => item.kind === "fabricated-first-person"));

  const obfuscated = acceptEditedCandidate(request, {
    text: "Content\u200b Factory 用于内容生产。",
    reasons: ["调整文本"],
    vendorMethod: "humanizer"
  });
  assert.equal(obfuscated.status, "review-required");
  assert.ok(obfuscated.findings.some(item => item.kind === "text-obfuscation"));
});

test("CF-018 preserves protected facts and terms before accepting an edit", () => {
  const request = prepareEditRequest({
    text: "Content Factory 延迟为 120 ms，运行 `npm test`。",
    profile,
    round: 0
  });
  const result = acceptEditedCandidate(request, {
    text: "内容工厂延迟约 150 s，运行 `npm run release`。",
    reasons: ["润色"],
    vendorMethod: "copy-editing"
  });

  assert.equal(result.status, "review-required");
  assert.ok(result.findings.some(item => item.kind === "protected-term"));
  assert.ok(result.findings.some(item => item.kind === "number"));
  assert.ok(result.findings.some(item => item.kind === "command"));
});

test("CF-018 deep edit requires fact mapping and automatic editing stops after two rounds", () => {
  const deep = prepareEditRequest({
    text: "原稿。",
    profile,
    intensity: "deep",
    round: 1
  });
  assert.equal(deep.requireFactMap, true);

  const stopped = prepareEditRequest({
    text: "仍不满意的稿件。",
    profile,
    intensity: "deep",
    round: 2
  });
  assert.equal(stopped.action, "human-review");
  assert.equal(stopped.allowVendorCall, false);
});
