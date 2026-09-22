#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {{
 *   currentEvidenceCommit: string,
 *   packageVersion: string,
 *   requiredTasks: Array<{id: string, status: string}>,
 *   releaseCandidate: {
 *     selected: boolean,
 *     packageVersion: string,
 *     commit: string | null,
 *     packageSha256: string | null,
 *     candidateCommitIsAncestor: boolean,
 *     packageDigestVerified: boolean,
 *     manifestCommitVerified: boolean
 *   },
 *   liveEvidenceStatus: string,
 *   declaredCombinationCount: number,
 *   evaluatedCombinationCount: number,
 *   requiredCapabilityCount: number,
 *   verifiedRequiredCapabilityCount: number,
 *   failedRequiredCapabilityCount: number,
 *   notRunRequiredCapabilityCount: number,
 *   vendorAuditPassed: boolean,
 *   duplicateMediaSkills: string[]
 * }} snapshot
 */
export function evaluateReleaseGate(snapshot) {
  const blockers = [];
  for (const task of snapshot.requiredTasks) {
    if (task.status !== "COMPLETE") blockers.push(`required-task-not-complete:${task.id}`);
  }
  if (!snapshot.releaseCandidate.selected) {
    blockers.push("release-candidate-not-selected");
  } else {
    if (!snapshot.releaseCandidate.candidateCommitIsAncestor) {
      blockers.push("release-candidate-commit-not-ancestor");
    }
    if (snapshot.releaseCandidate.packageVersion !== snapshot.packageVersion) {
      blockers.push("release-candidate-package-mismatch");
    }
    if (!snapshot.releaseCandidate.packageDigestVerified) {
      blockers.push("release-candidate-package-digest-unverified");
    }
    if (!snapshot.releaseCandidate.manifestCommitVerified) {
      blockers.push("release-candidate-manifest-commit-unverified");
    }
  }
  if (snapshot.liveEvidenceStatus !== "VERIFIED") blockers.push("live-evidence-not-verified");
  if (snapshot.evaluatedCombinationCount !== snapshot.declaredCombinationCount) {
    blockers.push(
      `combination-evaluation-incomplete:${snapshot.evaluatedCombinationCount}/${snapshot.declaredCombinationCount}`
    );
  }
  if (snapshot.verifiedRequiredCapabilityCount !== snapshot.requiredCapabilityCount) {
    blockers.push(
      `required-capability-coverage-incomplete:${snapshot.verifiedRequiredCapabilityCount}/${snapshot.requiredCapabilityCount}`
    );
  }
  if (snapshot.failedRequiredCapabilityCount > 0) {
    blockers.push(`required-capability-failed:${snapshot.failedRequiredCapabilityCount}`);
  }
  if (snapshot.notRunRequiredCapabilityCount > 0) {
    blockers.push(`required-capability-not-run:${snapshot.notRunRequiredCapabilityCount}`);
  }
  if (!snapshot.vendorAuditPassed) blockers.push("vendor-audit-failed");
  for (const skill of snapshot.duplicateMediaSkills) blockers.push(`duplicate-media-skill:${skill}`);

  return {
    schemaVersion: 1,
    verdict: blockers.length === 0 ? "passed" : "blocked",
    commit: snapshot.currentEvidenceCommit,
    packageVersion: snapshot.packageVersion,
    blockers
  };
}

async function readJson(root, relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

async function verifyCandidatePackage(root, releaseCandidate) {
  if (!releaseCandidate.selected || !releaseCandidate.commit || !releaseCandidate.packageSha256) {
    return { packageDigestVerified: false, manifestCommitVerified: false };
  }
  const checkout = await mkdtemp(path.join(os.tmpdir(), "content-factory-candidate-"));
  try {
    const clone = spawnSync(
      "git",
      ["clone", "--quiet", "--no-checkout", "--no-hardlinks", root, checkout],
      { cwd: root, encoding: "utf8" }
    );
    if (clone.status !== 0) return { packageDigestVerified: false, manifestCommitVerified: false };
    const checkoutCommit = spawnSync(
      "git",
      ["checkout", "--quiet", "--detach", releaseCandidate.commit],
      { cwd: checkout, encoding: "utf8" }
    );
    if (checkoutCommit.status !== 0) {
      return { packageDigestVerified: false, manifestCommitVerified: false };
    }
    const build = spawnSync(process.execPath, ["scripts/build.mjs"], {
      cwd: checkout,
      encoding: "utf8",
      env: { ...process.env, CONTENT_FACTORY_SOURCE_COMMIT: releaseCandidate.commit }
    });
    if (build.status !== 0) return { packageDigestVerified: false, manifestCommitVerified: false };
    const manifestBytes = await readFile(path.join(checkout, "dist/build-manifest.json"));
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    return {
      packageDigestVerified: createHash("sha256").update(manifestBytes).digest("hex") ===
        releaseCandidate.packageSha256,
      manifestCommitVerified: manifest.sourceCommit === releaseCandidate.commit
    };
  } catch {
    return { packageDigestVerified: false, manifestCommitVerified: false };
  } finally {
    await rm(checkout, { recursive: true, force: true });
  }
}

async function currentSnapshot(root) {
  const packageJson = await readJson(root, "package.json");
  const liveIndex = await readJson(root, "docs/verification/channel-live-index.json");
  const skillLock = await readJson(root, "skills.lock.json");
  const requiredTasks = await Promise.all(
    ["CF-001", "CF-030", "CF-035", "CF-037", "CF-038", "CF-039", "CF-040", "CF-041", "CF-057"].map(async id => {
      const evidence = await readJson(root, `docs/verification/tasks/${id}.json`);
      return { id, status: evidence.status };
    })
  );
  const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  const audit = spawnSync(process.execPath, [path.join(root, "scripts/audit-release.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  const skills = skillLock.sources.flatMap(source => source.skills);
  const duplicateMediaSkills = skills.filter(skill =>
    /(?:image|video|audio).*(?:gen|render|production)|(?:gen|render).*(?:image|video|audio)/iu.test(skill)
  );
  const releaseCandidate = liveIndex.releaseCandidate;
  const ancestry = releaseCandidate.selected && releaseCandidate.commit
    ? spawnSync("git", ["merge-base", "--is-ancestor", releaseCandidate.commit, "HEAD"], {
        cwd: root,
        encoding: "utf8"
      }).status === 0
    : false;
  const candidateVerification = await verifyCandidatePackage(root, releaseCandidate);
  const declaredCombinationCount = liveIndex.declaredCombinationCount ??
    liveIndex.expectedCombinationCount;
  const evaluatedCombinationCount = liveIndex.evaluatedCombinationCount ??
    liveIndex.liveCombinationCount;
  const requiredCapabilityCount = liveIndex.requiredCapabilityCount ??
    declaredCombinationCount * 4;
  const verifiedRequiredCapabilityCount = liveIndex.verifiedRequiredCapabilityCount ?? 0;
  const failedRequiredCapabilityCount = liveIndex.failedRequiredCapabilityCount ?? 0;
  const notRunRequiredCapabilityCount = liveIndex.notRunRequiredCapabilityCount ??
    requiredCapabilityCount - verifiedRequiredCapabilityCount - failedRequiredCapabilityCount;

  return {
    currentEvidenceCommit: git.status === 0 ? git.stdout.trim() : "unknown",
    packageVersion: packageJson.version,
    requiredTasks,
    releaseCandidate: {
      ...releaseCandidate,
      candidateCommitIsAncestor: ancestry,
      ...candidateVerification
    },
    liveEvidenceStatus: liveIndex.status,
    declaredCombinationCount,
    evaluatedCombinationCount,
    requiredCapabilityCount,
    verifiedRequiredCapabilityCount,
    failedRequiredCapabilityCount,
    notRunRequiredCapabilityCount,
    vendorAuditPassed: audit.status === 0,
    duplicateMediaSkills
  };
}

async function main() {
  const root = process.cwd();
  const report = evaluateReleaseGate(await currentSnapshot(root));
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
  if (report.verdict !== "passed") process.exitCode = 1;
}

const invokedPath = process.argv[1] === undefined ? "" : path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) await main();
