import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8"));
}

test("CF-042 keeps package and three host manifest versions consistent", async () => {
  const files = [
    "package.json",
    ".codex-plugin/plugin.json",
    ".zcode-plugin/plugin.json",
    "kimi.plugin.json"
  ];
  const manifests = await Promise.all(files.map(file => readJson(file)));
  assert.deepEqual(manifests.map(item => item.version), ["0.1.0", "0.1.0", "0.1.0", "0.1.0"]);
});

test("CF-042 candidate manifest references every P0 task and remains blocked", async () => {
  const candidate = await readJson("docs/verification/release-candidate.json");
  assert.equal(candidate.targetVersion, "1.0.0");
  assert.equal(candidate.currentVersion, "0.1.0");
  assert.equal(candidate.releaseStatus, "BLOCKED");
  assert.equal(candidate.releaseCommit, null);
  assert.equal(candidate.packageSha256, null);
  assert.deepEqual(candidate.requiredTaskEvidence.map((item: { task: string }) => item.task), [
    "CF-001", "CF-035", "CF-037", "CF-038", "CF-039", "CF-040", "CF-041", "CF-058"
  ]);
  for (const item of candidate.requiredTaskEvidence) {
    await readFile(new URL(`../../${item.evidenceRef}`, import.meta.url), "utf8");
  }
  assert.deepEqual(candidate.marketUpdates, []);
});

test("CF-042 public documentation reports current capabilities and blocked release honestly", async () => {
  const english = await readFile(new URL("../../README.md", import.meta.url), "utf8");
  const chinese = await readFile(new URL("../../README.zh-CN.md", import.meta.url), "utf8");
  const changelog = await readFile(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
  const guide = await readFile(
    new URL("../../docs/guides/status-and-verification.md", import.meta.url),
    "utf8"
  );
  for (const document of [english, chinese]) {
    assert.equal(document.includes("CF-005 | IN_PROGRESS"), false);
    assert.equal(document.includes("263"), true);
    assert.equal(document.includes("BLOCKED"), true);
  }
  assert.equal(changelog.includes("## [Unreleased]"), true);
  assert.equal(changelog.includes("## [1.0.0]"), false);
  assert.equal(guide.includes("Offline verification is not live verification"), true);
  assert.equal(guide.includes("npm run release:gate"), true);
});

test("CF-042 final gate remains non-zero and no v1.0.0 tag is created", () => {
  const gate = spawnSync(process.execPath, ["scripts/release-gate.mjs", "--json"], {
    cwd: new URL("../../", import.meta.url),
    encoding: "utf8"
  });
  assert.equal(gate.status, 1);
  assert.equal(JSON.parse(gate.stdout).verdict, "blocked");

  const tags = spawnSync("git", ["tag", "--list", "v1.0.0"], {
    cwd: new URL("../../", import.meta.url),
    encoding: "utf8"
  });
  assert.equal(tags.status, 0);
  assert.equal(tags.stdout.trim(), "");
});
