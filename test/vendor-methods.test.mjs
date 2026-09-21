import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  SHARED_VENDOR_METHODS,
  resolveSharedVendorMethod
} from "../adapters/content-methods/vendor-methods.ts";
import { hashSkillDir } from "../scripts/vendor/skill_vendor.mjs";

const MARKETINGSKILLS_SHA = "2c13accb72ee1feb847dedf16c6e59a53ee45c9b";
const EXPECTED_SKILLS = [
  "content-strategy",
  "copy-editing",
  "copywriting",
  "product-marketing",
  "social"
];

test("CF-047 installs the immutable reviewed marketingskills source", async () => {
  const lock = JSON.parse(await readFile("skills.lock.json", "utf8"));
  const source = lock.sources.find(item => item.package === "marketingskills");
  assert.ok(source);
  assert.equal(source.ref, "v2.9.1");
  assert.equal(source.sha, MARKETINGSKILLS_SHA);
  assert.equal(source.license.spdx, "MIT");
  assert.deepEqual([...source.skills].sort(), EXPECTED_SKILLS);
  for (const skill of source.skills) {
    assert.equal(await hashSkillDir(path.resolve("skills", skill)), source.sha256[skill]);
  }
  const notice = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(notice, /coreyhaines31\/marketingskills/u);
  assert.match(notice, /v2\.9\.1/u);
});

test("CF-047 retains complete references and evaluation fixtures", async () => {
  for (const file of [
    "skills/content-strategy/references/headless-cms.md",
    "skills/product-marketing/evals/evals.json",
    "skills/copywriting/references/natural-transitions.md",
    "skills/copy-editing/references/checklist.md",
    "skills/social/references/listening.md",
    "skills/social/evals/evals.json"
  ]) {
    assert.ok((await stat(file)).isFile(), file);
  }
});

test("CF-047 resolves reviewed aliases to bounded candidate-only methods", () => {
  const social = resolveSharedVendorMethod("social-content");
  assert.deepEqual(social, resolveSharedVendorMethod("social"));
  assert.deepEqual(social.capabilities, ["writing.social", "writing.spoken"]);
  assert.equal(social.permissionClass, "candidate-only");
  assert.equal(social.requiresKernelValidation, true);
  assert.deepEqual(social.directActions, []);

  const product = resolveSharedVendorMethod("product-marketing-context");
  assert.deepEqual(product, resolveSharedVendorMethod("product-marketing"));
  assert.deepEqual(product.capabilities, ["context.product"]);
});

test("CF-047 records unmodified effective hashes and rejects unrelated capabilities", () => {
  assert.equal(SHARED_VENDOR_METHODS.length, 5);
  for (const method of SHARED_VENDOR_METHODS) {
    assert.equal(method.source.package, "marketingskills");
    assert.equal(method.source.ref, "v2.9.1");
    assert.equal(method.upstreamSha256, method.effectiveSha256);
    assert.equal(method.patchSha256, null);
  }
  assert.equal(resolveSharedVendorMethod("baoyu-image-gen"), null);
  assert.equal(resolveSharedVendorMethod("baoyu-post-to-x"), null);
  assert.equal(resolveSharedVendorMethod("unknown-method"), null);
});

test("CF-047 security review records vendor instructions that remain behind kernel authority", async () => {
  const review = JSON.parse(await readFile(
    "tests/fixtures/vendor-content/marketingskills-v2.9.1.json",
    "utf8"
  ));
  assert.equal(review.source_commit, MARKETINGSKILLS_SHA);
  assert.deepEqual(Object.keys(review.skills).sort(), EXPECTED_SKILLS);
  assert.deepEqual(review.runtime_policy.direct_actions, []);
  assert.equal(review.runtime_policy.kernel_validation_required, true);
  assert.match(review.skills.social.review_notes.join(" "), /network recipes/u);
  assert.match(review.skills["product-marketing"].review_notes.join(" "), /file-write/u);
});
