import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const SOURCE_SHA = "c1e1526c84fd07d71d9d12e9845dceeb366d1b42";

test("CF-005 locks the immutable Baoyu formatting baseline", async () => {
  const lock = JSON.parse(await readFile("skills.lock.json", "utf8"));
  const source = lock.sources.find(item => item.package === "baoyu-skills");
  assert.ok(source, "baoyu-skills source must be locked");
  assert.equal(source.ref, "v1.63.0");
  assert.equal(source.sha, SOURCE_SHA);
  assert.deepEqual(source.skills.sort(), [
    "baoyu-format-markdown",
    "baoyu-markdown-to-html"
  ]);
  assert.equal(source.license.spdx, "MIT");
  for (const name of source.skills) {
    assert.match(source.sha256[name], /^[0-9a-f]{64}$/);
  }
});

test("CF-005 vendors complete skill trees including pinned dependency metadata", async () => {
  for (const file of [
    "skills/baoyu-format-markdown/SKILL.md",
    "skills/baoyu-format-markdown/scripts/package-lock.json",
    "skills/baoyu-markdown-to-html/SKILL.md",
    "skills/baoyu-markdown-to-html/scripts/md/package-lock.json"
  ]) {
    const info = await stat(file);
    assert.ok(info.isFile(), file);
  }
});

test("CF-005 excludes visual-generation skills from Content Factory", async () => {
  const lock = JSON.parse(await readFile("skills.lock.json", "utf8"));
  const all = lock.sources.flatMap(item => item.skills);
  for (const forbidden of [
    "baoyu-image-gen",
    "baoyu-cover-image",
    "baoyu-article-illustrator",
    "baoyu-xhs-images",
    "baoyu-infographic",
    "baoyu-comic"
  ]) {
    assert.ok(!all.includes(forbidden), forbidden + " must stay in Image Factory");
  }
});

test("CF-005 offline supply-chain verification passes and notice records provenance", async () => {
  const check = spawnSync(process.execPath, [path.resolve("scripts/check-skills.mjs"), "--offline"], {
    encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);

  const notice = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(notice, /full-aigc-skills\/baoyu-skills/);
  assert.match(notice, /v1\.63\.0/);
  assert.match(notice, /MIT/);
});
