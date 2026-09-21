export type FactFindingKind =
  | "number"
  | "percentage"
  | "unit"
  | "negation"
  | "time-range"
  | "command"
  | "url"
  | "citation-target";

export type FactFinding = {
  kind: FactFindingKind;
  before: string;
  after: string;
  severity: "blocking";
};

export type SemanticReview = {
  status: "pass" | "needs-review" | "fail";
  notes: string[];
};

export type CitationBinding = {
  claimId: string;
  expectedSourceId: string;
  expectedLocator: string;
  actualSourceId: string;
  actualLocator: string;
};

export type HumanReviewDecision = {
  decision: "accepted" | "rejected" | "accepted_with_exception";
  reason: string;
};

export type ReviewReport = {
  deterministicFindings: FactFinding[];
  semanticReview: SemanticReview;
  citationBindings: CitationBinding[];
  deliveryEligible: boolean;
  humanDecision: HumanReviewDecision | null;
};

function matches(text: string, expression: RegExp): string[] {
  return [...text.matchAll(expression)].map(match => match[0]);
}

function normalizedList(values: string[]): string {
  return values.join(" | ");
}

function compareTokenClass(
  kind: FactFindingKind,
  before: string[],
  after: string[]
): FactFinding[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  return [{
    kind,
    before: normalizedList(before),
    after: normalizedList(after),
    severity: "blocking"
  }];
}

export function analyzeProtectedFacts(before: string, after: string): FactFinding[] {
  const findings: FactFinding[] = [];

  findings.push(...compareTokenClass(
    "percentage",
    matches(before, /\d+(?:\.\d+)?\s*[%％]/gu),
    matches(after, /\d+(?:\.\d+)?\s*[%％]/gu)
  ));
  findings.push(...compareTokenClass(
    "time-range",
    matches(before, /\b\d{4}\s*[-–—]\s*\d{4}\b/gu),
    matches(after, /\b\d{4}\s*[-–—]\s*\d{4}\b/gu)
  ));
  findings.push(...compareTokenClass(
    "number",
    matches(before, /\b\d+(?:\.\d+)?\b/gu),
    matches(after, /\b\d+(?:\.\d+)?\b/gu)
  ));
  findings.push(...compareTokenClass(
    "unit",
    matches(before, /\b(?:ms|s|sec|second|seconds|KB|MB|GB|TB|px|dpi|fps|Hz|kHz|MHz|GHz)\b|毫秒|秒|分钟|小时|天|字节|千字节|兆字节|吉字节/giu),
    matches(after, /\b(?:ms|s|sec|second|seconds|KB|MB|GB|TB|px|dpi|fps|Hz|kHz|MHz|GHz)\b|毫秒|秒|分钟|小时|天|字节|千字节|兆字节|吉字节/giu)
  ));
  findings.push(...compareTokenClass(
    "negation",
    matches(before, /不得|不能|不会|没有|未|无|不|\b(?:not|no|never|without)\b/giu),
    matches(after, /不得|不能|不会|没有|未|无|不|\b(?:not|no|never|without)\b/giu)
  ));
  findings.push(...compareTokenClass(
    "command",
    matches(before, /\x60([^\x60\n]+)\x60/gu).map(value => value.slice(1, -1)),
    matches(after, /\x60([^\x60\n]+)\x60/gu).map(value => value.slice(1, -1))
  ));
  findings.push(...compareTokenClass(
    "url",
    matches(before, /https?:\/\/[^\s，。；！？)\]}>"']+/gu),
    matches(after, /https?:\/\/[^\s，。；！？)\]}>"']+/gu)
  ));

  return findings;
}

export function createReviewReport(input: {
  before: string;
  after: string;
  citationBindings: CitationBinding[];
  semanticReview: SemanticReview;
}): ReviewReport {
  const deterministicFindings = analyzeProtectedFacts(input.before, input.after);
  for (const binding of input.citationBindings) {
    if (
      binding.expectedSourceId !== binding.actualSourceId
      || binding.expectedLocator !== binding.actualLocator
    ) {
      deterministicFindings.push({
        kind: "citation-target",
        before: `${binding.expectedSourceId}:${binding.expectedLocator}`,
        after: `${binding.actualSourceId}:${binding.actualLocator}`,
        severity: "blocking"
      });
    }
  }

  return {
    deterministicFindings,
    semanticReview: {
      status: input.semanticReview.status,
      notes: [...input.semanticReview.notes]
    },
    citationBindings: input.citationBindings.map(binding => ({ ...binding })),
    deliveryEligible:
      deterministicFindings.length === 0 && input.semanticReview.status === "pass",
    humanDecision: null
  };
}

export function recordHumanReviewDecision(
  report: ReviewReport,
  decision: HumanReviewDecision
): ReviewReport {
  if (!decision.reason.trim()) {
    throw new Error("human review decision requires a reason");
  }
  return {
    ...report,
    deterministicFindings: report.deterministicFindings.map(item => ({ ...item })),
    semanticReview: {
      ...report.semanticReview,
      notes: [...report.semanticReview.notes]
    },
    citationBindings: report.citationBindings.map(item => ({ ...item })),
    humanDecision: { ...decision }
  };
}
