export type DetectionEvidenceCategory = "human" | "original-ai" | "edited";
export type DetectionEvidenceKind = "none" | "synthetic-fixture" | "live-api";

export type DetectionEvidenceSample = {
  category: DetectionEvidenceCategory;
  status: "not-run" | "recorded";
  evidenceKind: DetectionEvidenceKind;
  requestId: string | null;
  rawResponseSha256: string | null;
  classification: {
    aiRatio: number;
    suspectedRatio: number;
    confidence: number;
  } | null;
};

export type DetectionEvidenceReport = {
  title: string;
  textHash: string;
  reportKind: "self-built-api-summary";
  officialProviderDocument: false;
  qualityProofClaim: false;
  webApiParity: "not-verified";
  liveStatus: "NOT_RUN" | "RECORDED";
  productionAdmission: boolean;
  samples: DetectionEvidenceSample[];
  notes: string[];
};

const REQUIRED_CATEGORIES: DetectionEvidenceCategory[] = [
  "human",
  "original-ai",
  "edited"
];

function completeLiveSet(samples: DetectionEvidenceSample[]): boolean {
  if (samples.length !== REQUIRED_CATEGORIES.length) return false;
  const categories = new Set(samples.map(item => item.category));
  return REQUIRED_CATEGORIES.every(category => categories.has(category))
    && samples.every(item => item.status === "recorded"
      && item.evidenceKind === "live-api"
      && typeof item.requestId === "string"
      && item.requestId.length > 0
      && typeof item.rawResponseSha256 === "string"
      && /^[0-9a-f]{64}$/u.test(item.rawResponseSha256)
      && item.classification !== null);
}

export function buildDetectionEvidenceReport(input: {
  title: string;
  textHash: string;
  samples: DetectionEvidenceSample[];
}): DetectionEvidenceReport {
  const productionAdmission = completeLiveSet(input.samples);
  const notes = [
    "low-scores-are-not-quality-proof",
    "web-api-parity-not-verified"
  ];
  if (input.samples.some(item => item.evidenceKind === "synthetic-fixture")) {
    notes.push("synthetic-fixtures-are-not-live-evidence");
  }
  if (!productionAdmission) notes.push("live-evidence-not-run");

  return {
    title: input.title,
    textHash: input.textHash,
    reportKind: "self-built-api-summary",
    officialProviderDocument: false,
    qualityProofClaim: false,
    webApiParity: "not-verified",
    liveStatus: productionAdmission ? "RECORDED" : "NOT_RUN",
    productionAdmission,
    samples: input.samples.map(sample => ({
      ...sample,
      classification: sample.classification ? { ...sample.classification } : null
    })),
    notes
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDetectionEvidenceHtml(
  report: DetectionEvidenceReport
): string {
  const rows = report.samples.map(sample => {
    const ratios = sample.classification === null
      ? "未记录"
      : `AI ${sample.classification.aiRatio}; 疑似 ${sample.classification.suspectedRatio}; 置信度 ${sample.classification.confidence}`;
    return `<tr><td>${escapeHtml(sample.category)}</td><td>${escapeHtml(sample.status)}</td><td>${escapeHtml(sample.evidenceKind)}</td><td>${escapeHtml(ratios)}</td></tr>`;
  }).join("");
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title></head>
<body>
  <main>
    <h1>${escapeHtml(report.title)}</h1>
    <p>AI 内容检测平台：基于 API 结果整理的自建报告</p>
    <p>Live status: <strong>${report.liveStatus}</strong></p>
    <p>本报告不把较低分类比例作为插件质量证明，网页与 API 一致性尚未验证。</p>
    <table><thead><tr><th>样本</th><th>状态</th><th>证据类型</th><th>结果</th></tr></thead><tbody>${rows}</tbody></table>
  </main>
</body>
</html>`;
}
