export type DetectionClassification = {
  aiRatio: number | null;
  suspectedRatio: number | null;
  confidence: number | null;
};

export type NormalizedDetectionSegment = {
  text: string;
  label: string;
  confidence: number | null;
};

export type NormalizedDetectionReport = {
  status: "evaluable" | "not-evaluable";
  classification: DetectionClassification;
  segments: NormalizedDetectionSegment[];
  issues: string[];
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function ratio(value: unknown): number | null {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
    ? value
    : null;
}

function normalizeSegments(value: unknown): NormalizedDetectionSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: NormalizedDetectionSegment[] = [];
  for (const candidate of value) {
    const item = record(candidate);
    if (!item || typeof item.text !== "string" || item.text.length === 0
        || typeof item.label !== "string" || item.label.length === 0) {
      continue;
    }
    segments.push({
      text: item.text,
      label: item.label,
      confidence: ratio(item.confidence)
    });
  }
  return segments;
}

export function normalizeDetectionPayload(
  payload: unknown
): NormalizedDetectionReport {
  const root = record(payload);
  const summary = record(root?.summary);
  const aiRatio = ratio(summary?.ai_ratio);
  const suspectedRatio = ratio(summary?.suspected_ratio);
  const confidence = ratio(summary?.confidence);
  const issues: string[] = [];

  if (aiRatio === null) issues.push("missing-or-invalid-ai-ratio");
  if (suspectedRatio === null) {
    issues.push("missing-or-invalid-suspected-ratio");
  }
  if (confidence === null) {
    issues.push("missing-or-invalid-summary-confidence");
  }

  return {
    status: issues.length === 0 ? "evaluable" : "not-evaluable",
    classification: { aiRatio, suspectedRatio, confidence },
    segments: normalizeSegments(root?.segments),
    issues
  };
}
