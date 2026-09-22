import assert from "node:assert/strict";
import test from "node:test";

import { renderReviewPage } from "../packages/core/src/render/review-page.ts";
import {
  findChromiumExecutable,
  resolveChromiumStartupTimeout,
  withChromiumPage
} from "../scripts/chromium-harness.mjs";

const baseInput = {
  requestedRevisionId: "rev-current",
  currentRevisionId: "rev-current",
  packageStatus: "working-draft",
  current: {
    title: "本地审阅稿",
    body: "可信正文 v2"
  },
  previous: {
    revisionId: "rev-previous",
    body: "可信正文 v1"
  },
  sources: [
    { sourceId: "public-1", label: "公开来源", uri: "https://example.com/public", visibility: "public" },
    { sourceId: "private-1", label: "私人访谈姓名", uri: "file:///private/interview.txt", visibility: "private" }
  ],
  reports: [
    { reportId: "fact-1", kind: "fact", status: "passed", revisionId: "rev-current", summary: "事实检查通过", visibility: "public" },
    { reportId: "private-1", kind: "editorial", status: "passed", revisionId: "rev-current", summary: "私人编辑备注", visibility: "private" }
  ]
};

test("CF-024 Chromium startup budget tolerates slow CI runners and remains configurable", () => {
  assert.equal(resolveChromiumStartupTimeout({}), 30_000);
  assert.equal(resolveChromiumStartupTimeout({ CONTENT_FACTORY_CHROMIUM_STARTUP_TIMEOUT_MS: "45000" }), 45_000);
  assert.equal(resolveChromiumStartupTimeout({ CONTENT_FACTORY_CHROMIUM_STARTUP_TIMEOUT_MS: "invalid" }), 30_000);
});

test("CF-024 renders five inert review regions without leaking private material", () => {
  const result = renderReviewPage(baseInput);
  assert.equal(result.status, "succeeded");
  assert.equal(result.regionCount, 5);
  for (const region of ["status", "content", "diff", "sources", "reports"]) {
    assert.match(result.html, new RegExp(`data-region="${region}"`, "u"));
  }
  assert.match(result.html, /工作稿/u);
  assert.match(result.html, /可信正文 v<del>1<\/del><ins>2<\/ins>/u);
  assert.match(result.html, /公开来源/u);
  assert.match(result.html, /事实检查通过/u);
  assert.doesNotMatch(result.html, /私人访谈姓名|private\/interview|私人编辑备注/u);
  assert.doesNotMatch(result.html, /<script\b|<form\b|<button\b|fetch\(|XMLHttpRequest/iu);
  assert.match(result.html, /default-src 'none'/u);

  const verified = renderReviewPage({ ...baseInput, packageStatus: "verified-package" });
  assert.equal(verified.status, "succeeded");
  assert.match(verified.html, /已验证包/u);
});

test("CF-024 blocks a preview requested for a stale revision", () => {
  const result = renderReviewPage({ ...baseInput, requestedRevisionId: "rev-stale" });
  assert.deepEqual(result, {
    status: "blocked",
    reason: "stale-revision",
    requestedRevisionId: "rev-stale",
    currentRevisionId: "rev-current"
  });
});

test("CF-024 marks a stale report without attaching its summary to the current body", () => {
  const result = renderReviewPage({
    ...baseInput,
    reports: [{
      reportId: "fact-old",
      kind: "fact",
      status: "passed",
      revisionId: "rev-previous",
      summary: "旧稿曾经通过",
      visibility: "public"
    }]
  });
  assert.equal(result.status, "succeeded");
  assert.match(result.html, /报告已过期/u);
  assert.doesNotMatch(result.html, /旧稿曾经通过/u);
});

test("CF-024 opening the local preview performs no HTTP resource request", async t => {
  if (!findChromiumExecutable()) {
    t.skip("local Chromium executable unavailable");
    return;
  }
  const result = renderReviewPage(baseInput);
  assert.equal(result.status, "succeeded");
  const remoteResources = await withChromiumPage(
    { width: 390, height: 884, html: result.html },
    page => page.evaluate("performance.getEntriesByType('resource').map(entry => entry.name).filter(name => /^https?:/.test(name))")
  );
  assert.deepEqual(remoteResources, []);
});
