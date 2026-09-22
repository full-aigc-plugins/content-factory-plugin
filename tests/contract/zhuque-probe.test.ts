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

const comparisonObservationPaths = [
  {
    category: "human",
    path: path.resolve(
      "tests/fixtures/zhuque/2026-09-22-human-website-observation.json"
    )
  },
  {
    category: "original-ai",
    path: path.resolve(
      "tests/fixtures/zhuque/2026-09-22-original-ai-website-observation.json"
    )
  },
  {
    category: "edited",
    path: path.resolve(
      "tests/fixtures/zhuque/2026-09-22-edited-website-observation.json"
    )
  }
] as const;

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
  assert.deepEqual(observation.apiProbe.unauthenticated, {
    status: "OBSERVED_AUTH_REJECTION",
    observedAt: "2026-09-22T09:34:25Z",
    requestBodySha256:
      "6abf230d1e6c479023842f3a6ef89f5b3629e9162bc85fdf4854d86be15c11ac",
    requestBytes: 72,
    credentialSent: false,
    httpStatus: 401,
    errorType: "auth_missing",
    errorCode: "auth_missing",
    paidCalls: 0,
    traceIdentifiersRedacted: true
  });
  assert.equal(
    observation.apiProbe.authenticated.status,
    "NOT_RUN_CREDENTIAL_REQUIRED"
  );
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

test("CF-030 human, original AI, and edited website observations are distinct, traceable, and secret-free", () => {
  const observations = comparisonObservationPaths.map(({ category, path: fixturePath }) => {
    assert.equal(
      existsSync(fixturePath),
      true,
      `${category} website observation must be checked in as sanitized evidence`
    );

    const observation = JSON.parse(readFileSync(fixturePath, "utf8"));
    const serialized = JSON.stringify(observation);

    assert.equal(observation.sampleCategory, category);
    assert.equal(observation.evidenceClass, "PARTIAL_LIVE_WEBSITE");
    assert.equal(observation.providerAlias, "AI 内容检测平台");
    assert.equal(observation.transport, "official-website-websocket");
    assert.equal(observation.request.rightsBasis, "project-owned-fixture");
    assert.equal(observation.request.transmissionApproved, true);
    assert.match(observation.request.textSha256, /^[a-f0-9]{64}$/u);
    assert.equal(observation.response.status, "success");
    assert.equal(observation.response.feedbackTokenPresent, true);
    assert.equal(observation.response.feedbackTokenRedacted, true);
    assert.equal(observation.productionAdmission, false);
    assert.equal(observation.secretsInRecord, false);
    assert.doesNotMatch(serialized, /feedback_token|Bearer\s+|eyJ[a-zA-Z0-9_-]*\./u);

    return observation;
  });

  assert.equal(
    new Set(observations.map(observation => observation.request.textSha256)).size,
    3,
    "human, original AI, and edited observations must bind different submitted texts"
  );
});
