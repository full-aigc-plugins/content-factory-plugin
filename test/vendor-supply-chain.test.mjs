import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cli = path.resolve("scripts/vendor/skill_vendor.mjs");

async function workspace() {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-vendor-"));
  await mkdir(path.join(root, "skills", "content-harness"), { recursive: true });
  await writeFile(path.join(root, "skills", "content-harness", "SKILL.md"), "# content-harness\n");
  await writeFile(
    path.join(root, "plugin-local-skills.json"),
    JSON.stringify({ version: 1, dest: "skills/", skills: ["content-harness"] }, null, 2)
  );
  return root;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args, "--root", root], {
    encoding: "utf8"
  });
}

test("check rejects floating branch refs", async () => {
  const root = await workspace();
  await writeFile(
    path.join(root, "skills.lock.json"),
    JSON.stringify({
      version: 1,
      sources: [{
        package: "demo",
        repo: "https://example.invalid/demo.git",
        ref: "main",
        sha: "0".repeat(40),
        skills: ["demo-skill"],
        dest: "skills/",
        sha256: { "demo-skill": "0".repeat(64) },
        license: { spdx: "MIT", evidence: "LICENSE" }
      }]
    }, null, 2)
  );

  const result = run(root, "check", "--offline");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /immutable semantic version tag/i);
});

test("check rejects vendor and plugin-local overlap", async () => {
  const root = await workspace();
  await writeFile(
    path.join(root, "skills.lock.json"),
    JSON.stringify({
      version: 1,
      sources: [{
        package: "demo",
        repo: "https://example.invalid/demo.git",
        ref: "v1.0.0",
        sha: "1".repeat(40),
        skills: ["content-harness"],
        dest: "skills/",
        sha256: { "content-harness": "1".repeat(64) },
        license: { spdx: "MIT", evidence: "LICENSE" }
      }]
    }, null, 2)
  );

  const result = run(root, "check", "--offline");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /plugin-local skills must not appear/i);
});

test("check rejects missing license provenance", async () => {
  const root = await workspace();
  await writeFile(
    path.join(root, "skills.lock.json"),
    JSON.stringify({
      version: 1,
      sources: [{
        package: "demo",
        repo: "https://example.invalid/demo.git",
        ref: "v1.0.0",
        sha: "1".repeat(40),
        skills: ["demo-skill"],
        dest: "skills/",
        sha256: { "demo-skill": "1".repeat(64) }
      }]
    }, null, 2)
  );

  const result = run(root, "check", "--offline");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /license provenance/i);
});

test("check accepts a valid local harness with an empty managed source set", async () => {
  const root = await workspace();
  await writeFile(
    path.join(root, "skills.lock.json"),
    JSON.stringify({ version: 1, sources: [] }, null, 2)
  );

  const result = run(root, "check", "--offline");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /skill supply chain check passed/i);
});
