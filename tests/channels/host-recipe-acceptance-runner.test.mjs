import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(".");
const runner = path.join(root, "scripts/run-host-recipe-acceptance.mjs");
const fixture = path.join(root, "tests/fixtures/channel-writing/catalog-examples.json");

function execute(extra = []) {
  const manifest = JSON.parse(spawnSync(
    process.execPath,
    ["-e", `process.stdout.write(require('fs').readFileSync(${JSON.stringify(path.join(root, "dist/build-manifest.json"))}, 'utf8'))`],
    { encoding: "utf8" }
  ).stdout);
  return spawnSync(process.execPath, [
    runner,
    "--host", "codex",
    "--host-version", "test-runtime",
    "--candidate-root", path.join(root, "dist"),
    "--expected-version", "1.0.0-rc.2",
    "--expected-source-commit", manifest.sourceCommit,
    "--fixture", fixture,
    "--json",
    ...extra
  ], { cwd: root, encoding: "utf8" });
}

function executeInstalled() {
  const manifest = JSON.parse(spawnSync(
    process.execPath,
    ["-e", `process.stdout.write(require('fs').readFileSync(${JSON.stringify(path.join(root, "dist/build-manifest.json"))}, 'utf8'))`],
    { encoding: "utf8" }
  ).stdout);
  return spawnSync(process.execPath, [
    runner,
    "--installed-host", "codex",
    "--summary",
    "--json"
  ], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CONTENT_FACTORY_ACCEPTANCE_CODEX_ROOT: path.join(root, "dist"),
      CONTENT_FACTORY_ACCEPTANCE_MANIFEST: path.join(root, "dist/build-manifest.json"),
      CONTENT_FACTORY_ACCEPTANCE_SOURCE_COMMIT: manifest.sourceCommit,
      CONTENT_FACTORY_ACCEPTANCE_VERSION: "1.0.0-rc.2"
    }
  });
}

test("CF-057 host runner verifies all 39 recipes and 156 required capabilities", () => {
  const run = execute();
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.status, "VERIFIED_HOST_RECIPES");
  assert.equal(report.host.id, "codex");
  assert.equal(report.candidate.version, "1.0.0-rc.2");
  assert.equal(report.recipeCount, 39);
  assert.equal(report.evaluatedCombinationCount, 39);
  assert.equal(report.requiredCapabilityCount, 156);
  assert.equal(report.verifiedRequiredCapabilityCount, 156);
  assert.equal(report.failedRequiredCapabilityCount, 0);
  assert.equal(report.notRunRequiredCapabilityCount, 0);
  assert.equal(report.remoteCalls, 0);
  assert.equal(report.accountAccess, "NOT_RUN");
  assert.equal(report.temporaryExportsRemoved, true);
  assert.match(report.recipeEvidenceSha256, /^[a-f0-9]{64}$/u);
  assert.equal(report.recipes.length, 39);
  assert.equal(new Set(report.recipes.map(item => item.recipeKey)).size, 39);
  for (const item of report.recipes) {
    assert.deepEqual(item.requiredCapabilities, {
      profileResolution: "VERIFIED",
      vendorContract: "VERIFIED",
      authoring: "VERIFIED",
      workingExport: "VERIFIED"
    });
    assert.match(item.profileRef, /@/u);
    assert.match(item.recipeRef, /@/u);
    assert.match(item.authoringFingerprint, /^[a-f0-9]{64}$/u);
    assert.match(item.exportManifestSha256, /^[a-f0-9]{64}$/u);
  }
});

test("CF-057 host runner can return a digest-bound compact host receipt", () => {
  const run = execute(["--summary"]);
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.status, "VERIFIED_HOST_RECIPES");
  assert.equal(report.recipeCount, 39);
  assert.equal(report.verifiedRequiredCapabilityCount, 156);
  assert.match(report.recipeEvidenceSha256, /^[a-f0-9]{64}$/u);
  assert.equal(Object.hasOwn(report, "recipes"), false);
});

test("CF-057 host runner verifies a source checkout against a separate package manifest", () => {
  const run = execute([
    "--candidate-root", root,
    "--manifest", path.join(root, "dist/build-manifest.json"),
    "--summary"
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.candidate.manifestFiles, 268);
  assert.equal(report.recipeCount, 39);
  assert.equal(report.verifiedRequiredCapabilityCount, 156);
});

test("CF-057 installed-host shorthand remains digest-bound and portable", () => {
  const run = executeInstalled();
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.host.id, "codex");
  assert.equal(report.recipeCount, 39);
  assert.equal(report.verifiedRequiredCapabilityCount, 156);
  assert.equal(Object.hasOwn(report, "recipes"), false);
});

test("CF-057 host runner rejects candidate provenance drift", () => {
  const run = execute(["--expected-source-commit", "0000000000000000000000000000000000000000"]);
  assert.equal(run.status, 2);
  const error = JSON.parse(run.stderr);
  assert.equal(error.error.code, "CANDIDATE_SOURCE_COMMIT_MISMATCH");
});
