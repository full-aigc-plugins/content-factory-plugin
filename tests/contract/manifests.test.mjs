import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), "utf8"));
}

test("CF-001 declares immutable vendor sources", async () => {
  const lock = await readJson("skills.lock.json");
  assert.equal(lock.version, 1);
  assert.ok(Array.isArray(lock.sources) && lock.sources.length > 0);

  for (const source of lock.sources) {
    assert.match(source.ref, /^v\d+\.\d+\.\d+$/);
    assert.match(source.sha, /^[0-9a-f]{40}$/);
    assert.ok(Array.isArray(source.skills) && source.skills.length > 0);
    assert.equal(typeof source.license, "string");
    assert.ok(source.license.length > 0);
    assert.equal(typeof source.license_evidence, "string");
    assert.ok(source.license_evidence.length > 0);
    assert.equal(typeof source.sha256, "object");
    for (const skill of source.skills) {
      assert.match(source.sha256[skill], /^[0-9a-f]{64}$/);
    }
  }
});

test("CF-001 protects the one plugin-local content harness", async () => {
  const local = await readJson("plugin-local-skills.json");
  assert.equal(local.version, 1);
  assert.equal(local.dest, "skills/");
  assert.deepEqual(local.skills, ["content-harness"]);
});

test("CF-001 excludes visual generation skills from Content Factory", async () => {
  const lock = await readJson("skills.lock.json");
  const names = lock.sources.flatMap((source) => source.skills);
  const forbidden = [
    "baoyu-image-gen",
    "baoyu-cover-image",
    "baoyu-article-illustrator",
    "baoyu-xhs-images",
    "baoyu-infographic",
    "baoyu-comic",
    "baoyu-slide-deck"
  ];
  for (const name of forbidden) {
    assert.equal(names.includes(name), false, `${name} belongs to Image Factory`);
  }
});
