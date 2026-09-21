import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthorProfile,
  reviseAuthorProfile,
  validateProtectedTerms
} from "../packages/core/src/content/author-profile.ts";

test("CF-014 creates a deterministic default author profile without sample text", () => {
  const profile = createAuthorProfile({
    profileId: "author_default",
    sampleTexts: [],
    protectedTerms: ["Partme Agent Fabric", "ms"],
    blockedPhrases: []
  });

  assert.equal(profile.profileId, "author_default");
  assert.equal(profile.revision, 1);
  assert.deepEqual(profile.style.tone, ["clear", "specific"]);
  assert.equal(profile.style.sentenceRhythm, "balanced");
  assert.deepEqual(profile.protectedTerms, ["ms", "Partme Agent Fabric"]);
  assert.equal("sampleTexts" in profile, false);
});

test("CF-014 extracts style features without retaining private sample details", () => {
  const privateClient = "SecretCustomer-X";
  const profile = createAuthorProfile({
    profileId: "author_private",
    sampleTexts: [
      `我为${privateClient}做过一次交付。短句。再补一个较长的解释句，说明为什么要保留证据链。`
    ],
    privateFacts: [privateClient],
    protectedTerms: ["Content Factory"],
    blockedPhrases: []
  });

  const serialized = JSON.stringify(profile);
  assert.equal(serialized.includes(privateClient), false);
  assert.equal(serialized.includes("我为"), false);
  assert.ok(profile.style.averageSentenceLength > 0);
});

test("CF-014 protected brand terms and units cannot be silently replaced", () => {
  const profile = createAuthorProfile({
    profileId: "author_terms",
    sampleTexts: [],
    protectedTerms: ["Content Factory", "ms"],
    blockedPhrases: []
  });

  assert.deepEqual(
    validateProtectedTerms(
      "Content Factory 延迟为 120 ms。",
      "Content Factory 延迟为 120 ms。",
      profile
    ),
    []
  );

  const violations = validateProtectedTerms(
    "Content Factory 延迟为 120 ms。",
    "内容工厂延迟约 120 毫秒。",
    profile
  );
  assert.deepEqual(violations.map(item => item.term), ["Content Factory", "ms"]);
});

test("CF-014 changing author preferences creates a new immutable profile revision", () => {
  const first = createAuthorProfile({
    profileId: "author_rev",
    sampleTexts: ["简洁直接。"],
    protectedTerms: ["Partme"],
    blockedPhrases: ["赋能"]
  });
  const second = reviseAuthorProfile(first, {
    sampleTexts: ["句子可以更完整一些，但不要堆砌形容词。"],
    protectedTerms: ["Partme", "Agent Fabric"],
    blockedPhrases: ["赋能", "闭环抓手"]
  });

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.deepEqual(first.protectedTerms, ["Partme"]);
  assert.deepEqual(second.protectedTerms, ["Agent Fabric", "Partme"]);
  assert.notEqual(second.fingerprint, first.fingerprint);
});
