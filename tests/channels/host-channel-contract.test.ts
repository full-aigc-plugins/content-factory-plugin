import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadChannelRegistry } from "../../packages/core/src/channels/registry.ts";

type LiveIndex = {
  schemaVersion: number;
  status: "NOT_RUN" | "PARTIAL";
  releaseCandidate: {
    selected: boolean;
    packageVersion: string;
    commit: string | null;
    packageSha256: string | null;
  };
  hosts: string[];
  recipes: string[];
  accountClasses: string[];
  dimensions: Array<{
    id: string;
    applicability: "required" | "optional" | "out_of_scope";
    status: "NOT_RUN" | "PARTIAL";
    evidenceRefs: string[];
  }>;
  declaredCombinationCount: number;
  evaluatedCombinationCount: number;
  requiredCapabilityCount: number;
  verifiedRequiredCapabilityCount: number;
  failedRequiredCapabilityCount: number;
  notRunRequiredCapabilityCount: number;
};

async function readIndex(): Promise<LiveIndex> {
  return JSON.parse(await readFile(
    new URL("../../docs/verification/channel-live-index.json", import.meta.url),
    "utf8"
  )) as LiveIndex;
}

test("CF-057 indexes every declared host and channel recipe without inventing an account", async () => {
  const index = await readIndex();
  const registry = await loadChannelRegistry();
  assert.deepEqual(index.hosts, ["codex", "zcode", "kimi"]);
  assert.deepEqual(index.recipes, registry.recipes.map(item => `${item.channelId}/${item.formatId}`));
  assert.deepEqual(index.accountClasses, ["authorized-external-account"]);
  assert.equal(index.declaredCombinationCount, 3 * 39);
});

test("CF-057 separates every required live operation dimension", async () => {
  const index = await readIndex();
  assert.deepEqual(index.dimensions.map(item => item.id), [
    "profile-resolution",
    "vendor-contract",
    "authoring",
    "working-export",
    "authorized-source-read",
    "draft-save",
    "draft-readback",
    "public-publish",
    "feedback-read",
    "reply-draft"
  ]);
});

test("CF-057 records two evaluated hosts without promoting the quota-blocked host", async () => {
  const index = await readIndex();
  assert.equal(index.status, "PARTIAL");
  assert.equal(index.releaseCandidate.selected, true);
  assert.equal(index.releaseCandidate.packageVersion, "1.0.0-rc.2");
  assert.match(index.releaseCandidate.commit!, /^[a-f0-9]{40}$/u);
  assert.match(index.releaseCandidate.packageSha256!, /^[a-f0-9]{64}$/u);
  assert.equal(index.evaluatedCombinationCount, 2 * 39);
  assert.equal(index.requiredCapabilityCount, 3 * 39 * 4);
  assert.equal(index.verifiedRequiredCapabilityCount, 2 * 39 * 4);
  assert.equal(index.failedRequiredCapabilityCount, 0);
  assert.equal(index.notRunRequiredCapabilityCount, 39 * 4);
  assert.deepEqual(index.dimensions.map(item => item.applicability), [
    "required",
    "required",
    "required",
    "required",
    "optional",
    "optional",
    "optional",
    "out_of_scope",
    "optional",
    "optional"
  ]);
  assert.equal(index.dimensions.slice(0, 4).every(item => item.status === "PARTIAL"), true);
  assert.equal(index.dimensions.slice(0, 4).every(item => item.evidenceRefs.length === 1), true);
  assert.equal(index.dimensions.slice(4).every(item => item.status === "NOT_RUN"), true);
  assert.equal(index.dimensions.slice(4).every(item => item.evidenceRefs.length === 0), true);
});

test("CF-057 binds Codex and ZCode receipts while preserving the Kimi quota blocker", async () => {
  const evidence = JSON.parse(await readFile(
    new URL("../../docs/verification/host-recipe-acceptance.json", import.meta.url),
    "utf8"
  ));
  assert.equal(evidence.candidate.version, "1.0.0-rc.2");
  assert.equal(evidence.candidate.sourceCommit, "33ff3315bbea626fb5428a70e9f445b2b9165bc4");
  assert.equal(evidence.hosts.codex.status, "VERIFIED_HOST_RECIPES");
  assert.equal(evidence.hosts.zcode.status, "VERIFIED_HOST_RECIPES");
  assert.equal(evidence.hosts.kimi.status, "BLOCKED_HOST_QUOTA");
  assert.equal(evidence.hosts.codex.recipeEvidenceSha256, evidence.hosts.zcode.recipeEvidenceSha256);
  assert.equal(evidence.evaluatedCombinationCount, 78);
  assert.equal(evidence.verifiedRequiredCapabilityCount, 312);
  assert.equal(evidence.notRunRequiredCapabilityCount, 156);
  assert.equal(evidence.remoteCalls, 0);
  assert.equal(evidence.secretsInRecord, false);
});

test("CF-057 human-readable matrix states that offline contracts are not live proof", async () => {
  const matrix = await readFile(
    new URL("../../docs/verification/channel-host-matrix.md", import.meta.url),
    "utf8"
  );
  assert.equal(matrix.includes("Offline contract tests are not live host evidence"), true);
  assert.equal(matrix.includes("Public publishing is outside the V1 release promise"), true);
});

test("CF-057 release evidence reports partial coverage and the actual remaining task", async () => {
  const [release, hostTask] = await Promise.all([
    readFile(new URL("../../docs/verification/channel-release.md", import.meta.url), "utf8"),
    readFile(new URL("../../docs/verification/tasks/CF-041.json", import.meta.url), "utf8")
  ]);
  assert.equal(release.includes("Live evidence status is `PARTIAL`"), true);
  assert.equal(release.includes("Live evidence status is `NOT_RUN`"), false);
  assert.equal(JSON.parse(hostTask).blocker.includes("CF-035"), true);
});
