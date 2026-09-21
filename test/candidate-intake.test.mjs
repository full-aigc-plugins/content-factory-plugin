import assert from "node:assert/strict";
import test from "node:test";

import {
  assessCandidateUse,
  advanceCandidate,
  createCandidateRecord
} from "../packages/core/src/skills/candidates.ts";

test("CF-043 display title and catalog score never fabricate canonical identity or admission", () => {
  const candidate = createCandidateRecord({
    displayName: "写作文风复刻大师",
    namespace: "skillhub",
    owner: null,
    slug: null,
    observedVersion: null,
    observedAt: "2026-09-20T00:00:00Z",
    evidenceTier: "indexed-snapshot",
    retrievalLimits: ["live-detail-unavailable"],
    catalogScore: 4.8,
    license: null
  });

  assert.equal(candidate.status, "discovered");
  assert.equal(candidate.canonicalIdentity, null);
  assert.equal(candidate.observedVersion, null);
  assert.equal(candidate.license, null);
  assert.equal(candidate.executable, false);
});

test("CF-043 partial discovery remains explicit and cannot claim a complete latest ranking", () => {
  const candidate = createCandidateRecord({
    displayName: "Douyin Data Method",
    namespace: "skillhub",
    owner: "org-cgmj9q07",
    slug: null,
    observedVersion: null,
    observedAt: "2026-09-20T00:00:00Z",
    evidenceTier: "indexed-snapshot",
    retrievalLimits: ["category-pagination-unavailable", "package-bytes-unavailable"],
    catalogScore: null,
    license: null
  });

  assert.equal(candidate.discoveryCoverage, "partial");
  assert.equal(candidate.latestRankingVerified, false);
});

test("CF-043 lock admission rejects missing license, immutable source and matching signature evidence", () => {
  const candidate = createCandidateRecord({
    displayName: "candidate",
    namespace: "skillhub",
    owner: "publisher",
    slug: "candidate",
    observedVersion: "1.0.0",
    observedAt: "2026-09-20T00:00:00Z",
    evidenceTier: "live-detail",
    retrievalLimits: [],
    catalogScore: 5,
    license: null
  });

  const result = advanceCandidate(candidate, "locked", {
    sourceUrl: null,
    immutableRef: null,
    commit: null,
    contentHash: null,
    signatureVerified: false
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [
    "license",
    "source-url",
    "immutable-ref",
    "commit",
    "content-hash",
    "signature"
  ]);
  assert.equal(result.record.status, "discovered");
  assert.equal(result.record.executable, false);
});

test("CF-043 live SkillHub ranking remains candidate-only without package and contract evidence", () => {
  const candidate = createCandidateRecord({
    displayName: "文章去AI味工具",
    namespace: "skillhub",
    owner: "user_ab5ae6ee",
    slug: "unclecheng-reduce-ai-perception-v2",
    observedVersion: "1.0.5",
    observedAt: "2026-09-22T08:00:00Z",
    evidenceTier: "live-category",
    retrievalLimits: ["only-first-page-observed", "package-bytes-unavailable"],
    catalogScore: null,
    license: null
  });

  const assessment = assessCandidateUse(candidate, {
    capability: "edit",
    claims: ["natural-voice"]
  });

  assert.equal(candidate.canonicalIdentity, "skillhub/user_ab5ae6ee/unclecheng-reduce-ai-perception-v2");
  assert.equal(candidate.latestRankingVerified, false);
  assert.equal(candidate.executable, false);
  assert.deepEqual(assessment, {
    disposition: "candidate-only",
    capabilityOwner: "content-factory",
    allowedClaims: ["natural-voice"],
    rejectedClaims: [],
    reasons: ["candidate-not-contract-verified", "license-unverified", "package-bytes-unverified"]
  });
});

test("CF-043 rejects detector-evasion and traffic guarantees instead of treating them as editorial quality", () => {
  const candidate = createCandidateRecord({
    displayName: "文案去AI味+真人点评",
    namespace: "skillhub",
    owner: "org-28ib33ph",
    slug: "lingyi-copy-de-ai-human-eval",
    observedVersion: "0.2.0",
    observedAt: "2026-09-22T08:00:00Z",
    evidenceTier: "live-category",
    retrievalLimits: ["package-bytes-unavailable"],
    catalogScore: null,
    license: null
  });

  const assessment = assessCandidateUse(candidate, {
    capability: "quality-review",
    claims: ["natural-voice", "detector-evasion", "traffic-guarantee"]
  });

  assert.equal(assessment.disposition, "rejected");
  assert.deepEqual(assessment.allowedClaims, ["natural-voice"]);
  assert.deepEqual(assessment.rejectedClaims, ["detector-evasion", "traffic-guarantee"]);
  assert.ok(assessment.reasons.includes("unsafe-capability-claim"));
});

test("CF-043 keeps catalog media generation outside Content Factory ownership", () => {
  const candidate = createCandidateRecord({
    displayName: "白板动画制作",
    namespace: "skillhub",
    owner: "user_87b8e34f",
    slug: "whiteboard-animation-maker",
    observedVersion: null,
    observedAt: "2026-09-22T08:00:00Z",
    evidenceTier: "live-category",
    retrievalLimits: ["package-bytes-unavailable"],
    catalogScore: null,
    license: null
  });

  const assessment = assessCandidateUse(candidate, {
    capability: "media-generation",
    claims: []
  });

  assert.equal(assessment.disposition, "external-owner");
  assert.equal(assessment.capabilityOwner, "image-factory");
  assert.ok(assessment.reasons.includes("media-generation-owned-by-image-factory"));
});
