import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDetectionPayload } from "../packages/core/src/detection/normalize.ts";
import { locateDetectionSegments } from "../packages/core/src/detection/segments.ts";

test("CF-026 keeps AI ratio, suspected ratio, and confidence as distinct fields", () => {
  const report = normalizeDetectionPayload({
    summary: {
      ai_ratio: 0.31,
      suspected_ratio: 0.12,
      confidence: 0.88
    },
    segments: [
      { text: "第一段", label: "ai", confidence: 0.73 }
    ]
  });

  assert.equal(report.status, "evaluable");
  assert.deepEqual(report.classification, {
    aiRatio: 0.31,
    suspectedRatio: 0.12,
    confidence: 0.88
  });
  assert.equal("aiPercentage" in report.classification, false);
  assert.deepEqual(report.issues, []);
});

test("CF-026 missing required summary fields is not evaluable and never becomes zero", () => {
  const report = normalizeDetectionPayload({
    summary: { confidence: 0.9 },
    segments: [{ text: "只有分块", label: "suspected" }]
  });

  assert.equal(report.status, "not-evaluable");
  assert.deepEqual(report.classification, {
    aiRatio: null,
    suspectedRatio: null,
    confidence: 0.9
  });
  assert.deepEqual(report.issues, [
    "missing-or-invalid-ai-ratio",
    "missing-or-invalid-suspected-ratio"
  ]);
});

test("CF-026 maps emoji and combining characters by verified text boundaries", () => {
  const canonicalText = "开头 👩‍💻e\u0301 结尾";
  const located = locateDetectionSegments(canonicalText, [{
    text: "👩‍💻e\u0301",
    label: "suspected",
    confidence: 0.64
  }]);

  assert.equal(located[0].locationStatus, "located");
  assert.equal(
    canonicalText.slice(located[0].startUtf16, located[0].endUtf16),
    "👩‍💻e\u0301"
  );
  assert.deepEqual(
    { startCodePoint: located[0].startCodePoint, endCodePoint: located[0].endCodePoint },
    { startCodePoint: 3, endCodePoint: 8 }
  );
  assert.deepEqual(
    { startGrapheme: located[0].startGrapheme, endGrapheme: located[0].endGrapheme },
    { startGrapheme: 3, endGrapheme: 5 }
  );
});

test("CF-026 repeated provider text is reported as ambiguous instead of highlighted", () => {
  const located = locateDetectionSegments("重复内容，然后重复内容。", [{
    text: "重复内容",
    label: "ai",
    confidence: null
  }]);

  assert.equal(located[0].locationStatus, "ambiguous");
  assert.equal(located[0].startUtf16, null);
  assert.equal(located[0].endUtf16, null);
  assert.equal(located[0].warning, "ambiguous-text-match");
});

test("CF-026 chunk-only results do not fabricate a whole-document average", () => {
  const report = normalizeDetectionPayload({
    segments: [
      { text: "一", label: "ai", confidence: 0.8 },
      { text: "二二二", label: "human", confidence: 0.9 }
    ]
  });

  assert.equal(report.status, "not-evaluable");
  assert.equal(report.classification.aiRatio, null);
  assert.equal(report.classification.suspectedRatio, null);
  assert.equal(report.classification.confidence, null);
  assert.ok(report.issues.includes("missing-or-invalid-summary-confidence"));
});
