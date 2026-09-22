import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateReleaseGate } from "../../scripts/release-gate.mjs";

const passingSnapshot = {
  currentCommit: "a".repeat(40),
  packageVersion: "1.0.0",
  foundationalTasks: [
    { id: "CF-001", status: "COMPLETE" },
    { id: "CF-037", status: "COMPLETE" },
    { id: "CF-040", status: "COMPLETE" }
  ],
  channelTask: { id: "CF-057", status: "COMPLETE" },
  releaseCandidate: {
    selected: true,
    packageVersion: "1.0.0",
    commit: "a".repeat(40)
  },
  liveEvidenceStatus: "VERIFIED",
  liveCombinationCount: 117,
  expectedCombinationCount: 117,
  vendorAuditPassed: true,
  duplicateMediaSkills: []
};

test("CF-058 passes only a same-commit package with complete base and live channel evidence", () => {
  assert.deepEqual(evaluateReleaseGate(passingSnapshot), {
    schemaVersion: 1,
    verdict: "passed",
    commit: "a".repeat(40),
    packageVersion: "1.0.0",
    blockers: []
  });
});

test("CF-058 aggregates missing, stale, and duplicate ownership evidence into blockers", () => {
  const result = evaluateReleaseGate({
    ...passingSnapshot,
    foundationalTasks: [{ id: "CF-001", status: "PARTIAL_OFFLINE" }],
    channelTask: { id: "CF-057", status: "PARTIAL_OFFLINE" },
    releaseCandidate: { selected: true, packageVersion: "0.9.0", commit: "b".repeat(40) },
    liveEvidenceStatus: "NOT_RUN",
    liveCombinationCount: 0,
    vendorAuditPassed: false,
    duplicateMediaSkills: ["image-generation"]
  });
  assert.equal(result.verdict, "blocked");
  assert.deepEqual(result.blockers, [
    "foundational-task-not-complete:CF-001",
    "channel-live-task-not-complete:CF-057",
    "release-candidate-commit-mismatch",
    "release-candidate-package-mismatch",
    "live-evidence-not-verified",
    "live-combination-coverage-incomplete:0/117",
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
  assert.equal(report.blockers.includes("channel-live-task-not-complete:CF-057"), true);
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
