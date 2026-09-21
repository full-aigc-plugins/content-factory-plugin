import assert from "node:assert/strict";
import test from "node:test";

import {
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
