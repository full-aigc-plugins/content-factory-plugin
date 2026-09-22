import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateEditorialBenchmark } from "../../packages/core/src/review/benchmark.ts";

const manifest = JSON.parse(await readFile(
  new URL("../fixtures/corpus/manifest.json", import.meta.url),
  "utf8"
));

function completedRecords(input = {}) {
  const structureAccepted = input.structureAccepted ?? 30;
  const severeAt = input.severeAt ?? -1;
  return Array.from({ length: 30 }, (_, index) => ({
    sampleId: `sample-${index + 1}`,
    reviewers: [
      {
        reviewerId: "owner-reviewer",
        role: "owner",
        status: "completed",
        severeFactError: index === severeAt,
        structureRewriteRequired: index >= structureAccepted,
        dimensions: {
          factuality: "accepted",
          naturalness: "accepted",
          purposeFit: "accepted",
          layout: "accepted"
        }
      },
      {
        reviewerId: "independent-reviewer",
        role: "independent",
        status: "completed",
        severeFactError: false,
        structureRewriteRequired: index >= structureAccepted,
        dimensions: {
          factuality: "accepted",
          naturalness: "accepted",
          purposeFit: "accepted",
          layout: "accepted"
        }
      }
    ]
  }));
}

test("CF-039 corpus contains five owned content types with six distinct samples each", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.samples.length, 30);
  assert.equal(new Set(manifest.samples.map(item => item.sampleId)).size, 30);
  const counts = Object.fromEntries(manifest.contentTypes.map(type => [type, 0]));
  for (const sample of manifest.samples) {
    counts[sample.contentType] += 1;
    assert.equal(sample.rights.basis, "project-owned-fixture");
    assert.equal(sample.rights.redistributable, true);
    assert.ok(sample.sourceText.length >= 20);
    assert.ok(sample.candidateText.length >= 20);
    assert.ok(sample.factAnchors.length >= 1);
    assert.deepEqual(sample.layoutViewports, [390, 768, 1280]);
    assert.deepEqual(sample.reviewers.map(item => item.role), ["owner", "independent"]);
    assert.ok(sample.reviewers.every(item => item.status === "not-run"));
  }
  assert.deepEqual(counts, {
    "research-analysis": 6,
    "technical-tutorial": 6,
    "product-update": 6,
    "customer-case": 6,
    "short-social-script": 6
  });
});

test("CF-039 checked-in corpus remains NOT_RUN until both human reviews exist", () => {
  const result = evaluateEditorialBenchmark(manifest.samples);

  assert.deepEqual(result, {
    status: "NOT_RUN",
    productionAdmission: false,
    totalSamples: 30,
    reviewedSamples: 0,
    severeFactErrors: null,
    structureAccepted: null,
    targets: { severeFactErrors: 0, structureAccepted: 27 },
    reason: "human-review-incomplete"
  });
  assert.equal("detectionScore" in result, false);
});

test("CF-039 one severe factual error fails regardless of all other scores", () => {
  const result = evaluateEditorialBenchmark(completedRecords({ severeAt: 4 }));
  assert.equal(result.status, "FAILED");
  assert.equal(result.productionAdmission, false);
  assert.equal(result.severeFactErrors, 1);
  assert.equal(result.structureAccepted, 30);
});

test("CF-039 fewer than 27 structure-accepted samples fails the benchmark", () => {
  const result = evaluateEditorialBenchmark(completedRecords({ structureAccepted: 26 }));
  assert.equal(result.status, "FAILED");
  assert.equal(result.severeFactErrors, 0);
  assert.equal(result.structureAccepted, 26);
});

test("CF-039 27 structure-accepted samples and zero severe errors passes only after dual review", () => {
  const result = evaluateEditorialBenchmark(completedRecords({ structureAccepted: 27 }));
  assert.equal(result.status, "PASSED");
  assert.equal(result.productionAdmission, true);
  assert.equal(result.reviewedSamples, 30);
  assert.equal(result.severeFactErrors, 0);
  assert.equal(result.structureAccepted, 27);
});
