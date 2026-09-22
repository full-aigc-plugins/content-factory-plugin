export type EditorialReviewDimensions = {
  factuality: "accepted" | "needs-revision";
  naturalness: "accepted" | "needs-revision";
  purposeFit: "accepted" | "needs-revision";
  layout: "accepted" | "needs-revision";
};

export type EditorialReviewerRecord = {
  reviewerId: string | null;
  role: "owner" | "independent";
  status: "not-run" | "completed";
  severeFactError: boolean | null;
  structureRewriteRequired: boolean | null;
  dimensions: EditorialReviewDimensions | null;
};

export type EditorialBenchmarkRecord = {
  sampleId: string;
  reviewers: EditorialReviewerRecord[];
};

export type EditorialBenchmarkResult = {
  status: "NOT_RUN" | "FAILED" | "PASSED";
  productionAdmission: boolean;
  totalSamples: number;
  reviewedSamples: number;
  severeFactErrors: number | null;
  structureAccepted: number | null;
  targets: { severeFactErrors: 0; structureAccepted: 27 };
  reason: string | null;
};

function completeDualReview(record: EditorialBenchmarkRecord): boolean {
  if (record.reviewers.length !== 2) return false;
  const roles = new Set(record.reviewers.map(review => review.role));
  return roles.has("owner")
    && roles.has("independent")
    && record.reviewers.every(review => review.status === "completed"
      && typeof review.reviewerId === "string"
      && review.reviewerId.trim().length > 0
      && typeof review.severeFactError === "boolean"
      && typeof review.structureRewriteRequired === "boolean"
      && review.dimensions !== null);
}

export function evaluateEditorialBenchmark(
  records: EditorialBenchmarkRecord[]
): EditorialBenchmarkResult {
  const targets = { severeFactErrors: 0 as const, structureAccepted: 27 as const };
  const completed = records.filter(completeDualReview);
  if (records.length !== 30 || completed.length !== records.length) {
    return {
      status: "NOT_RUN",
      productionAdmission: false,
      totalSamples: records.length,
      reviewedSamples: completed.length,
      severeFactErrors: null,
      structureAccepted: null,
      targets,
      reason: "human-review-incomplete"
    };
  }

  const severeFactErrors = completed.filter(record =>
    record.reviewers.some(review => review.severeFactError === true)
  ).length;
  const structureAccepted = completed.filter(record =>
    record.reviewers.every(review => review.structureRewriteRequired === false)
  ).length;
  const allDimensionsAccepted = completed.every(record =>
    record.reviewers.every(review =>
      review.dimensions !== null
      && Object.values(review.dimensions).every(value => value === "accepted")
    )
  );
  const passed = severeFactErrors === 0
    && structureAccepted >= targets.structureAccepted
    && allDimensionsAccepted;
  return {
    status: passed ? "PASSED" : "FAILED",
    productionAdmission: passed,
    totalSamples: records.length,
    reviewedSamples: completed.length,
    severeFactErrors,
    structureAccepted,
    targets,
    reason: passed ? null : "editorial-threshold-not-met"
  };
}
