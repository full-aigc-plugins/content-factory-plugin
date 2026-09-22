export type ReviewDetectionPolicy = {
  version: string;
  mode: "review";
};

export type ThresholdDetectionPolicy = {
  version: string;
  mode: "threshold";
  maxAiRatio: number;
  maxSuspectedRatio: number;
  minConfidence: number;
};

export type DetectionPolicy = ReviewDetectionPolicy | ThresholdDetectionPolicy;

export type PolicyVerdict = {
  verdict: "met" | "not-met" | "not-evaluable" | "review-required";
  policyVersion: string;
  thresholds: {
    maxAiRatio: number;
    maxSuspectedRatio: number;
    minConfidence: number;
  } | null;
  reasons: string[];
};

export const DEFAULT_DETECTION_POLICY: ReviewDetectionPolicy = {
  version: "1",
  mode: "review"
};

function validRatio(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function evaluateDetectionPolicy(input: {
  policy: DetectionPolicy;
  detectionStatus: "blocked" | "failed" | "unknown" | "succeeded";
  report: {
    status: "evaluable" | "not-evaluable";
    classification: {
      aiRatio: number | null;
      suspectedRatio: number | null;
      confidence: number | null;
    };
    issues: string[];
  };
}): PolicyVerdict {
  const { policy, report } = input;
  if (input.detectionStatus !== "succeeded") {
    return {
      verdict: "not-evaluable",
      policyVersion: policy.version,
      thresholds: policy.mode === "threshold" ? {
        maxAiRatio: policy.maxAiRatio,
        maxSuspectedRatio: policy.maxSuspectedRatio,
        minConfidence: policy.minConfidence
      } : null,
      reasons: [`detection-${input.detectionStatus}`]
    };
  }

  if (report.status !== "evaluable"
      || report.classification.aiRatio === null
      || report.classification.suspectedRatio === null
      || report.classification.confidence === null) {
    return {
      verdict: "not-evaluable",
      policyVersion: policy.version,
      thresholds: policy.mode === "threshold" ? {
        maxAiRatio: policy.maxAiRatio,
        maxSuspectedRatio: policy.maxSuspectedRatio,
        minConfidence: policy.minConfidence
      } : null,
      reasons: report.issues.length > 0 ? [...report.issues] : ["report-not-evaluable"]
    };
  }

  if (policy.mode === "review") {
    return {
      verdict: "review-required",
      policyVersion: policy.version,
      thresholds: null,
      reasons: ["policy-requires-human-review"]
    };
  }

  const thresholds = {
    maxAiRatio: policy.maxAiRatio,
    maxSuspectedRatio: policy.maxSuspectedRatio,
    minConfidence: policy.minConfidence
  };
  if (!Object.values(thresholds).every(validRatio)) {
    return {
      verdict: "not-evaluable",
      policyVersion: policy.version,
      thresholds,
      reasons: ["invalid-policy-threshold"]
    };
  }

  const reasons: string[] = [];
  if (report.classification.aiRatio > policy.maxAiRatio) {
    reasons.push("ai-ratio-above-policy");
  }
  if (report.classification.suspectedRatio > policy.maxSuspectedRatio) {
    reasons.push("suspected-ratio-above-policy");
  }
  if (report.classification.confidence < policy.minConfidence) {
    reasons.push("confidence-below-policy");
  }
  return {
    verdict: reasons.length === 0 ? "met" : "not-met",
    policyVersion: policy.version,
    thresholds,
    reasons
  };
}
