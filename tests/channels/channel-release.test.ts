import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateReleaseGate } from "../../scripts/release-gate.mjs";

const passingSnapshot = {
  currentEvidenceCommit: "e".repeat(40),
  packageVersion: "1.0.0-rc.1",
  requiredTasks: [
    { id: "CF-001", status: "COMPLETE" },
    { id: "CF-030", status: "COMPLETE" },
    { id: "CF-035", status: "COMPLETE" },
    { id: "CF-037", status: "COMPLETE" },
    { id: "CF-038", status: "COMPLETE" },
    { id: "CF-039", status: "COMPLETE" },
    { id: "CF-040", status: "COMPLETE" },
    { id: "CF-041", status: "COMPLETE" },
    { id: "CF-057", status: "COMPLETE" }
  ],
  releaseCandidate: {
    selected: true,
    packageVersion: "1.0.0-rc.1",
    commit: "c".repeat(40),
    packageSha256: "f".repeat(64),
    candidateCommitIsAncestor: true,
    packageDigestVerified: true
  },
  liveEvidenceStatus: "VERIFIED",
  declaredCombinationCount: 117,
  evaluatedCombinationCount: 117,
  requiredCapabilityCount: 468,
  verifiedRequiredCapabilityCount: 468,
  failedRequiredCapabilityCount: 0,
  notRunRequiredCapabilityCount: 0,
  vendorAuditPassed: true,
  duplicateMediaSkills: []
};

test("CF-058 accepts a digest-bound ancestor candidate with complete evaluated coverage", () => {
  assert.deepEqual(evaluateReleaseGate(passingSnapshot), {
    schemaVersion: 1,
    verdict: "passed",
    commit: "e".repeat(40),
    packageVersion: "1.0.0-rc.1",
    blockers: []
  });
});

test("CF-058 blocks incomplete required capabilities without demanding optional remote publication", () => {
  const result = evaluateReleaseGate({
    ...passingSnapshot,
    requiredTasks: [{ id: "CF-039", status: "PARTIAL_OFFLINE" }],
    releaseCandidate: {
      selected: true,
      packageVersion: "0.9.0",
      commit: "b".repeat(40),
      packageSha256: "f".repeat(64),
      candidateCommitIsAncestor: false,
      packageDigestVerified: false
    },
    liveEvidenceStatus: "NOT_RUN",
    evaluatedCombinationCount: 116,
    verifiedRequiredCapabilityCount: 466,
    failedRequiredCapabilityCount: 1,
    notRunRequiredCapabilityCount: 1,
    vendorAuditPassed: false,
    duplicateMediaSkills: ["image-generation"]
  });
  assert.equal(result.verdict, "blocked");
  assert.deepEqual(result.blockers, [
    "required-task-not-complete:CF-039",
    "release-candidate-commit-not-ancestor",
    "release-candidate-package-mismatch",
    "release-candidate-package-digest-unverified",
    "live-evidence-not-verified",
    "combination-evaluation-incomplete:116/117",
    "required-capability-coverage-incomplete:466/468",
    "required-capability-failed:1",
    "required-capability-not-run:1",
    "vendor-audit-failed",
    "duplicate-media-skill:image-generation"
  ]);
});

test("CF-058 checked-in release gate blocks the current skipped-live candidate", () => {
  const run = spawnSync(process.execPath, ["scripts/release-gate.mjs", "--json"], {
    cwd: new URL("../../", import.meta.url),
    encoding: "utf8"
  });
  assert.equal(run.status, 1);
  const report = JSON.parse(run.stdout);
  assert.equal(report.verdict, "blocked");
  assert.equal(report.blockers.includes("required-task-not-complete:CF-057"), true);
  assert.equal(report.blockers.includes("release-candidate-not-selected"), true);
  assert.equal(report.blockers.includes("live-evidence-not-verified"), true);
});

test("CF-058 has no dependency on CF-042 and documents the blocked release", async () => {
  const script = await readFile(new URL("../../scripts/release-gate.mjs", import.meta.url), "utf8");
  const report = await readFile(new URL("../../docs/verification/channel-release.md", import.meta.url), "utf8");
  assert.equal(script.includes("CF-042"), false);
  assert.equal(report.includes("Release verdict: **BLOCKED**"), true);
  assert.equal(report.includes("must not be released or published"), true);
});
