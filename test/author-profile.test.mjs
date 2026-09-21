import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthorProfile,
  reviseAuthorProfile,
  protectedTermsFor
} from "../packages/core/src/content/author-profile.ts";

test("CF-014 creates a safe default author profile without samples", () => {
  const profile = createAuthorProfile({
    profileId: "author_default",
    protectedTerms: ["Partme Agent Fabric", "ms"],
    forbiddenExpressions: ["革命性颠覆"]
  });
  assert.equal(profile.revision, 1);
  assert.equal(profile.parentRevisionId, null);
  assert.deepEqual(profile.sampleHashes, []);
  assert.equal(profile.voice.source, "default");
  assert.ok(profile.voice.guidance.length > 0);
  assert.deepEqual(protectedTermsFor(profile), ["Partme Agent Fabric", "ms"]);
});

test("CF-014 samples influence statistics without leaking sample-specific private facts", () => {
  const secret = "SecretClient-DoNotLeak";
  const profile = createAuthorProfile({
    profileId: "author_wan",
    samples: [
      `我更喜欢直接说明问题。这个项目服务于 ${secret}，但这个名字不是新稿事实。`,
      "先给结论，再解释原因；句子不必故意写得复杂。"
    ]
  });
  const serialized = JSON.stringify(profile);
  assert.doesNotMatch(serialized, /SecretClient-DoNotLeak/);
  assert.equal(profile.sampleHashes.length, 2);
  assert.ok(profile.voice.averageSentenceChars > 0);
  assert.equal(profile.voice.source, "samples");
});

test("CF-014 preserves exact protected terminology and deduplicates it", () => {
  const profile = createAuthorProfile({
    profileId: "brand",
    protectedTerms: ["Agent-PaaS", "Agent-PaaS", "3.2%", "ms", "毫秒"]
  });
  assert.deepEqual(
    protectedTermsFor(profile),
    ["Agent-PaaS", "3.2%", "ms", "毫秒"]
  );
});

test("CF-014 changing samples creates a new profile revision without mutating history", () => {
  const first = createAuthorProfile({
    profileId: "author_revisioned",
    samples: ["短句。直接表达。"]
  });
  const second = reviseAuthorProfile(first, {
    samples: ["这是新的样文版本，它用于产生新的文体统计。"],
    protectedTerms: ["Content Factory"]
  });
  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.equal(second.parentRevisionId, first.revisionId);
  assert.notEqual(second.revisionId, first.revisionId);
  assert.notDeepEqual(second.sampleHashes, first.sampleHashes);
  assert.deepEqual(protectedTermsFor(second), ["Content Factory"]);
});
