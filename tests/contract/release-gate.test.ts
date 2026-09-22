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
  assert.deepEqual(
    manifests.map(item => item.version),
    ["1.0.0-rc.1", "1.0.0-rc.1", "1.0.0-rc.1", "1.0.0-rc.1"]
  );
});

test("CF-042 candidate manifest references every P0 task and remains blocked", async () => {
  const candidate = await readJson("docs/verification/release-candidate.json");
  const liveIndex = await readJson("docs/verification/channel-live-index.json");
  assert.equal(candidate.targetVersion, "1.0.0");
  assert.equal(candidate.currentVersion, "1.0.0-rc.1");
  assert.equal(candidate.releaseStatus, "BLOCKED");
  assert.match(candidate.releaseCommit, /^[a-f0-9]{40}$/u);
  assert.match(candidate.packageSha256, /^[a-f0-9]{64}$/u);
  assert.equal(candidate.releaseCommit, liveIndex.releaseCandidate.commit);
  assert.equal(candidate.packageSha256, liveIndex.releaseCandidate.packageSha256);
  assert.deepEqual(candidate.requiredTaskEvidence.map((item: { task: string }) => item.task), [
    "CF-001", "CF-030", "CF-035", "CF-037", "CF-038", "CF-039", "CF-040", "CF-041", "CF-057", "CF-058"
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
    assert.equal(document.includes("267"), false);
    assert.equal(document.includes("PARTIAL_OFFLINE"), true);
    assert.equal(document.includes("BLOCKED"), true);
    assert.doesNotMatch(document, /Zhuque|朱雀/u);
  }
  assert.match(english, /exact test count is reported by the current CI run/u);
  assert.match(chinese, /精确测试数量以当前 CI 输出为准/u);
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
