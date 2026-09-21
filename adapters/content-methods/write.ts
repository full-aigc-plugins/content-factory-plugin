import { createHash } from "node:crypto";

import type { ContentBrief } from "../../packages/core/src/application/dispatch.ts";
import type { ClaimRegistry } from "../../packages/core/src/content/claims.ts";
import { ContentFactoryError } from "../../packages/core/src/errors.ts";

export type ContentType =
  | "research-analysis"
  | "technical-tutorial"
  | "product-update"
  | "customer-case"
  | "short-social-script";

export type OutlineRevision = {
  kind: "outline";
  contentType: ContentType;
  source: "template" | "user";
  sections: string[];
  fingerprint: string;
};

export type DraftRequest = {
  brief: ContentBrief;
  contentType: ContentType;
  outlineFingerprint: string;
  claims: ClaimRegistry["claims"];
  instructions: string[];
};

export type WritingRequest = {
  outlineRevision: OutlineRevision;
  draftRequest: DraftRequest;
  missingInputs: string[];
};

export type DraftRevision = {
  kind: "draft";
  text: string;
  vendorMethod: string;
  outlineFingerprint: string;
  fingerprint: string;
};

const TEMPLATE_SECTIONS: Record<ContentType, readonly string[]> = {
  "research-analysis": ["Summary", "Evidence", "Analysis", "Limitations"],
  "technical-tutorial": ["Problem", "Environment", "Steps", "Verification", "Trade-offs"],
  "product-update": ["What changed", "Why it matters", "How to use", "Limitations"],
  "customer-case": ["Context", "Problem", "Approach", "Outcome", "Lessons"],
  "short-social-script": ["Hook", "Value", "Proof", "Close"]
};

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function cleanSections(values: string[]): string[] {
  const sections = values.map(value => value.trim()).filter(Boolean);
  if (sections.length === 0) {
    throw new ContentFactoryError({
      code: "WRITING_OUTLINE_EMPTY",
      message: "writing outline requires at least one section",
      retryable: false
    });
  }
  return sections;
}

export function prepareWritingRequest(input: {
  contentType: ContentType;
  brief: ContentBrief;
  claimRegistry: ClaimRegistry;
  userOutline?: string[];
  caseFacts?: {
    customer?: string;
    problem?: string;
    approach?: string;
    outcome?: string;
  };
}): WritingRequest {
  if (!(input.contentType in TEMPLATE_SECTIONS)) {
    throw new ContentFactoryError({
      code: "WRITING_CONTENT_TYPE_UNSUPPORTED",
      message: "content type is unsupported",
      retryable: false,
      details: { contentType: input.contentType }
    });
  }

  const source: OutlineRevision["source"] =
    input.userOutline && input.userOutline.length > 0 ? "user" : "template";
  const sections = cleanSections(
    source === "user"
      ? [...input.userOutline!]
      : [...TEMPLATE_SECTIONS[input.contentType]]
  );
  const outlineFingerprint = fingerprint({
    contentType: input.contentType,
    source,
    sections
  });
  const outlineRevision: OutlineRevision = {
    kind: "outline",
    contentType: input.contentType,
    source,
    sections,
    fingerprint: outlineFingerprint
  };

  const missingInputs: string[] = [];
  if (input.contentType === "customer-case") {
    const caseFacts = input.caseFacts ?? {};
    if (!caseFacts.customer?.trim()) missingInputs.push("case_customer");
    if (!caseFacts.problem?.trim()) missingInputs.push("case_problem");
    if (!caseFacts.outcome?.trim()) missingInputs.push("case_outcome");
  }

  const instructions = [
    "Use only supplied claims and user-provided facts for factual assertions.",
    "Preserve code, commands, numbers, units, names, URLs, and citation targets.",
    "Do not invent customer outcomes, percentages, quotes, testimonials, or first-person experience.",
    "If required evidence is missing, leave the claim absent or mark the missing input for review."
  ];

  return {
    outlineRevision,
    missingInputs,
    draftRequest: {
      brief: {
        ...input.brief,
        sourceRefs: [...input.brief.sourceRefs],
        missingInputs: [...input.brief.missingInputs],
        assumptions: [...input.brief.assumptions]
      },
      contentType: input.contentType,
      outlineFingerprint,
      claims: input.claimRegistry.claims.map(claim => ({
        ...claim,
        evidence: claim.evidence.map(item => ({ ...item }))
      })),
      instructions
    }
  };
}

export function acceptVendorDraft(
  request: WritingRequest,
  candidate: {
    outlineFingerprint: string;
    text: string;
    vendorMethod: string;
  }
): DraftRevision {
  if (candidate.outlineFingerprint !== request.outlineRevision.fingerprint) {
    throw new ContentFactoryError({
      code: "WRITING_OUTLINE_MISMATCH",
      message: "vendor draft does not match the approved outline revision",
      retryable: false
    });
  }
  const text = candidate.text.trim();
  if (!text) {
    throw new ContentFactoryError({
      code: "WRITING_DRAFT_EMPTY",
      message: "vendor draft is empty",
      retryable: false
    });
  }
  const vendorMethod = candidate.vendorMethod.trim();
  if (!vendorMethod) {
    throw new ContentFactoryError({
      code: "WRITING_VENDOR_REQUIRED",
      message: "vendor method identity is required",
      retryable: false
    });
  }

  return {
    kind: "draft",
    text,
    vendorMethod,
    outlineFingerprint: candidate.outlineFingerprint,
    fingerprint: fingerprint({
      text,
      vendorMethod,
      outlineFingerprint: candidate.outlineFingerprint
    })
  };
}
