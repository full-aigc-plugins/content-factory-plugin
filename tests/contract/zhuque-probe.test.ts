import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildDetectionEvidenceReport
} from "../../packages/core/src/render/detection-report.ts";

const observationPath = path.resolve(
  "tests/fixtures/zhuque/2026-09-22-website-observation.json"
);

test("CF-003 checked-in website observation is secret-free and evidence-bound", () => {
  assert.equal(
    existsSync(observationPath),
    true,
    "the live website observation must be checked in as sanitized evidence"
  );
  const observation = JSON.parse(readFileSync(observationPath, "utf8"));
  const serialized = JSON.stringify(observation);

  assert.equal(observation.evidenceClass, "PARTIAL_LIVE_WEBSITE");
  assert.equal(observation.providerAlias, "AI 内容检测平台");
  assert.equal(observation.transport, "official-website-websocket");
  assert.equal(observation.request.textSha256,
    "34ae95c92ee27328622d4acad86df8515b2a29c641204c7592626fde075b2d97");
  assert.equal(observation.request.transmissionApproved, true);
  assert.equal(observation.response.status, "success");
  assert.deepEqual(observation.response.labelsRatio, {
    "0": 0.6341,
    "1": 0,
    "2": 0.3659
  });
  assert.equal(observation.response.feedbackTokenPresent, true);
  assert.equal(observation.response.feedbackTokenRedacted, true);
  assert.equal(observation.apiProbe.status, "NOT_RUN_CREDENTIAL_REQUIRED");
  assert.equal(observation.productionAdmission, false);
  assert.equal(observation.secretsInRecord, false);
  assert.doesNotMatch(serialized, /feedback_token|Bearer\s+|eyJ[a-zA-Z0-9_-]*\./u);
});

test("CF-030 website observation remains partial and cannot satisfy API admission", () => {
  const report = buildDetectionEvidenceReport({
    title: "website observation",
    textHash: "34ae95c92ee27328622d4acad86df8515b2a29c641204c7592626fde075b2d97",
    samples: [{
      category: "edited",
      status: "recorded",
      evidenceKind: "live-web",
      requestId: "website-observation-2026-09-22",
      rawResponseSha256: null,
      classification: {
        aiRatio: 0,
        suspectedRatio: 0.3659,
        confidence: 0.3659
      }
    }]
  });

  assert.equal(report.liveStatus, "PARTIAL_LIVE_WEBSITE");
  assert.equal(report.productionAdmission, false);
  assert.equal(report.webApiParity, "not-verified");
  assert.ok(report.notes.includes(
    "website-observation-does-not-prove-api-contract"
  ));
});
