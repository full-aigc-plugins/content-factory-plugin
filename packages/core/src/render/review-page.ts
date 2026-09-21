import { readFileSync } from "node:fs";

import { diffText } from "../content/diff.ts";

export type ReviewVisibility = "public" | "private";

export type ReviewPageInput = {
  requestedRevisionId: string;
  currentRevisionId: string;
  packageStatus: "working-draft" | "verified-package";
  current: { title: string; body: string };
  previous?: { revisionId: string; body: string };
  sources: Array<{
    sourceId: string;
    label: string;
    uri: string;
    visibility: ReviewVisibility;
  }>;
  reports: Array<{
    reportId: string;
    kind: string;
    status: string;
    revisionId: string;
    summary: string;
    visibility: ReviewVisibility;
  }>;
};

export type ReviewPageResult =
  | {
    status: "blocked";
    reason: "stale-revision";
    requestedRevisionId: string;
    currentRevisionId: string;
  }
  | {
    status: "succeeded";
    html: string;
    regionCount: 5;
    revisionId: string;
  };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDiff(previous: string | undefined, current: string): string {
  if (previous === undefined) {
    return "<p>没有可比较的上一版本。</p>";
  }
  const difference = diffText(previous, current);
  return `<p class="diff">${escapeHtml(difference.commonPrefix)}<del>${escapeHtml(difference.removed)}</del><ins>${escapeHtml(difference.added)}</ins>${escapeHtml(difference.commonSuffix)}</p>`;
}

function renderSources(input: ReviewPageInput): string {
  const entries = input.sources
    .filter(source => source.visibility === "public")
    .map(source => `<li data-source-id="${escapeHtml(source.sourceId)}"><strong>${escapeHtml(source.label)}</strong><span>${escapeHtml(source.uri)}</span></li>`)
    .join("");
  return entries || "<li>无公开来源。</li>";
}

function renderReports(input: ReviewPageInput): string {
  const entries = input.reports
    .filter(report => report.visibility === "public")
    .map(report => report.revisionId === input.currentRevisionId
      ? `<li data-report-state="current"><strong>${escapeHtml(report.kind)}</strong><span>${escapeHtml(report.status)}：${escapeHtml(report.summary)}</span></li>`
      : `<li data-report-state="stale">报告已过期（${escapeHtml(report.reportId)}）</li>`)
    .join("");
  return entries || "<li>无公开审阅报告。</li>";
}

export function renderReviewPage(input: ReviewPageInput): ReviewPageResult {
  if (input.requestedRevisionId !== input.currentRevisionId) {
    return {
      status: "blocked",
      reason: "stale-revision",
      requestedRevisionId: input.requestedRevisionId,
      currentRevisionId: input.currentRevisionId
    };
  }

  const css = readFileSync(new URL("../../../../templates/review/theme.css", import.meta.url), "utf8");
  const status = input.packageStatus === "verified-package" ? "已验证包" : "工作稿";
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><title>${escapeHtml(input.current.title)} — 本地审阅</title><style>${css}</style></head><body><main>
<section data-region="status"><h1>${escapeHtml(input.current.title)}</h1><p class="status">${status}</p><p>版本 ${escapeHtml(input.currentRevisionId)}</p></section>
<section data-region="content"><h2>正文</h2><article>${escapeHtml(input.current.body)}</article></section>
<section data-region="diff"><h2>版本差异</h2>${renderDiff(input.previous?.body, input.current.body)}</section>
<section data-region="sources"><h2>来源</h2><ul>${renderSources(input)}</ul></section>
<section data-region="reports"><h2>审阅报告</h2><ul>${renderReports(input)}</ul></section>
</main></body></html>`;
  return {
    status: "succeeded",
    html,
    regionCount: 5,
    revisionId: input.currentRevisionId
  };
}
