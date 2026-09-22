import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildDetectionEvidenceReport,
  renderDetectionEvidenceHtml
} from "../packages/core/src/render/detection-report.ts";

const categories = ["human", "original-ai", "edited"];

function samples(status, evidenceKind) {
  return categories.map((category, index) => ({
    category,
    status,
    evidenceKind,
    requestId: status === "recorded" ? `request-${index + 1}` : null,
    rawResponseSha256: status === "recorded" ? `${index + 1}`.repeat(64) : null,
    classification: status === "recorded" ? {
      aiRatio: 0.1 + index * 0.1,
      suspectedRatio: 0.05,
      confidence: 0.8
    } : null
  }));
}

test("CF-030 missing live samples remains NOT_RUN rather than pass", () => {
  const report = buildDetectionEvidenceReport({
    title: "离线报告",
    textHash: "a".repeat(64),
    samples: samples("not-run", "none")
  });

  assert.equal(report.liveStatus, "NOT_RUN");
  assert.equal(report.productionAdmission, false);
  assert.equal(report.reportKind, "self-built-api-summary");
  assert.equal(report.officialProviderDocument, false);
  assert.equal(report.qualityProofClaim, false);
  assert.equal(JSON.stringify(report).includes("PASS"), false);
});

test("CF-030 synthetic fixtures never satisfy live admission", () => {
  const report = buildDetectionEvidenceReport({
    title: "fixture report",
    textHash: "b".repeat(64),
    samples: samples("recorded", "synthetic-fixture")
  });

  assert.equal(report.liveStatus, "NOT_RUN");
  assert.equal(report.productionAdmission, false);
  assert.ok(report.notes.includes("synthetic-fixtures-are-not-live-evidence"));
});

test("CF-030 complete live API records remain evidence, not plugin quality proof", () => {
  const report = buildDetectionEvidenceReport({
    title: "live comparison",
    textHash: "c".repeat(64),
    samples: samples("recorded", "live-api")
  });

  assert.equal(report.liveStatus, "RECORDED");
  assert.equal(report.productionAdmission, true);
  assert.equal(report.qualityProofClaim, false);
  assert.equal(report.webApiParity, "not-verified");
  assert.deepEqual(report.samples.map(item => item.category), categories);
});

test("CF-030 HTML identifies a self-built API summary and escapes content", () => {
  const report = buildDetectionEvidenceReport({
    title: "<script>alert(1)</script>",
    textHash: "d".repeat(64),
    samples: samples("not-run", "none")
  });
  const html = renderDetectionEvidenceHtml(report);

  assert.equal(html.includes("<script>"), false);
  assert.ok(html.includes("基于 API 结果整理的自建报告"));
  assert.ok(html.includes("AI 内容检测平台"));
  assert.ok(html.includes("NOT_RUN"));
  assert.equal(html.includes("官方 PDF"), false);
});

test("CF-030 checked-in live evidence page explicitly records NOT_RUN", async () => {
  const markdown = await readFile(
    new URL("../docs/verification/detection-live.md", import.meta.url),
    "utf8"
  );

  assert.match(markdown, /Live status:\s*`NOT_RUN`/u);
  assert.match(markdown, /AI 内容检测平台/u);
  assert.match(markdown, /不能作为生产准入证据/u);
  assert.doesNotMatch(markdown, /AppSecret|Cookie|朱雀/u);
});
