#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {{
 *   currentCommit: string,
 *   packageVersion: string,
 *   foundationalTasks: Array<{id: string, status: string}>,
 *   channelTask: {id: string, status: string},
 *   releaseCandidate: {selected: boolean, packageVersion: string, commit: string | null},
 *   liveEvidenceStatus: string,
 *   liveCombinationCount: number,
 *   expectedCombinationCount: number,
 *   vendorAuditPassed: boolean,
 *   duplicateMediaSkills: string[]
 * }} snapshot
 */
export function evaluateReleaseGate(snapshot) {
  const blockers = [];
  for (const task of snapshot.foundationalTasks) {
    if (task.status !== "COMPLETE") blockers.push(`foundational-task-not-complete:${task.id}`);
  }
  if (snapshot.channelTask.status !== "COMPLETE") {
    blockers.push(`channel-live-task-not-complete:${snapshot.channelTask.id}`);
  }
  if (!snapshot.releaseCandidate.selected) {
    blockers.push("release-candidate-not-selected");
  } else {
    if (snapshot.releaseCandidate.commit !== snapshot.currentCommit) {
      blockers.push("release-candidate-commit-mismatch");
    }
    if (snapshot.releaseCandidate.packageVersion !== snapshot.packageVersion) {
      blockers.push("release-candidate-package-mismatch");
    }
  }
  if (snapshot.liveEvidenceStatus !== "VERIFIED") blockers.push("live-evidence-not-verified");
  if (snapshot.liveCombinationCount !== snapshot.expectedCombinationCount) {
    blockers.push(
      `live-combination-coverage-incomplete:${snapshot.liveCombinationCount}/${snapshot.expectedCombinationCount}`
    );
  }
  if (!snapshot.vendorAuditPassed) blockers.push("vendor-audit-failed");
  for (const skill of snapshot.duplicateMediaSkills) blockers.push(`duplicate-media-skill:${skill}`);

  return {
    schemaVersion: 1,
    verdict: blockers.length === 0 ? "passed" : "blocked",
    commit: snapshot.currentCommit,
    packageVersion: snapshot.packageVersion,
    blockers
  };
}

async function readJson(root, relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

async function currentSnapshot(root) {
  const packageJson = await readJson(root, "package.json");
  const liveIndex = await readJson(root, "docs/verification/channel-live-index.json");
  const skillLock = await readJson(root, "skills.lock.json");
  const foundationalTasks = await Promise.all(
    ["CF-001", "CF-037", "CF-040"].map(async id => {
      const evidence = await readJson(root, `docs/verification/tasks/${id}.json`);
      return { id, status: evidence.status };
    })
  );
  const channelEvidence = await readJson(root, "docs/verification/tasks/CF-057.json");
  const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  const audit = spawnSync(process.execPath, [path.join(root, "scripts/audit-release.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  const skills = skillLock.sources.flatMap(source => source.skills);
  const duplicateMediaSkills = skills.filter(skill =>
    /(?:image|video|audio).*(?:gen|render|production)|(?:gen|render).*(?:image|video|audio)/iu.test(skill)
  );

  return {
    currentCommit: git.status === 0 ? git.stdout.trim() : "unknown",
    packageVersion: packageJson.version,
    foundationalTasks,
    channelTask: { id: "CF-057", status: channelEvidence.status },
    releaseCandidate: liveIndex.releaseCandidate,
    liveEvidenceStatus: liveIndex.status,
    liveCombinationCount: liveIndex.liveCombinationCount,
    expectedCombinationCount: liveIndex.expectedCombinationCount,
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
