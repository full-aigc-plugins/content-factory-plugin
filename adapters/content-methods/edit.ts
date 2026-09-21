import { createHash } from "node:crypto";

import type { AuthorProfile } from "../../packages/core/src/content/author-profile.ts";
import { validateProtectedTerms } from "../../packages/core/src/content/author-profile.ts";
import { ContentFactoryError } from "../../packages/core/src/errors.ts";
import {
  DEFAULT_EDIT_POLICY,
  automaticEditAllowed,
  type EditIntensity
} from "../../packages/core/src/review/edit-policy.ts";
import {
  analyzeProtectedFacts,
  type FactFindingKind
} from "../../packages/core/src/review/facts.ts";

export type EditRequest = {
  originalText: string;
  intensity: EditIntensity;
  round: number;
  action: "vendor-edit" | "human-review";
  allowVendorCall: boolean;
  requireFactMap: boolean;
  style: AuthorProfile["style"];
  protectedTerms: string[];
  blockedPhrases: string[];
  instructions: string[];
};

export type EditFindingKind =
  | FactFindingKind
  | "protected-term"
  | "fabricated-first-person"
  | "text-obfuscation";

export type EditFinding = {
  kind: EditFindingKind;
  before: string;
  after: string;
  severity: "blocking";
};

export type EditedRevision = {
  kind: "edited";
  text: string;
  vendorMethod: string;
  intensity: EditIntensity;
  round: number;
  status: "accepted" | "review-required";
  findings: EditFinding[];
  reasons: string[];
  diff: {
    changed: boolean;
    beforeSha256: string;
    afterSha256: string;
  };
  fingerprint: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function prepareEditRequest(input: {
  text: string;
  profile: AuthorProfile;
  intensity?: EditIntensity;
  round: number;
}): EditRequest {
  if (!Number.isInteger(input.round) || input.round < 0) {
    throw new ContentFactoryError({
      code: "EDIT_ROUND_INVALID",
      message: "edit round must be a non-negative integer",
      retryable: false
    });
  }

  const intensity = input.intensity ?? DEFAULT_EDIT_POLICY.defaultIntensity;
  const allowVendorCall = automaticEditAllowed(input.round);

  return {
    originalText: input.text,
    intensity,
    round: input.round,
    action: allowVendorCall ? "vendor-edit" : "human-review",
    allowVendorCall,
    requireFactMap: intensity === "deep",
    style: {
      ...input.profile.style,
      tone: [...input.profile.style.tone]
    },
    protectedTerms: [...input.profile.protectedTerms],
    blockedPhrases: [...input.profile.blockedPhrases],
    instructions: [
      "Do not invent first-person experience, customers, outcomes, quotes, or testimonials.",
      "Do not alter protected facts, code, commands, dates, units, URLs, or citation targets.",
      "Do not use zero-width characters, homoglyph tricks, deliberate typos, or other detector-evasion techniques.",
      "Edit for clarity, natural voice, structure, and readability only."
    ]
  };
}

function introducedFirstPersonExperience(before: string, after: string): boolean {
  const experiencePattern = /我(?:曾经?|亲自|过去|以前|给|为).{0,24}(?:做过|部署|服务|负责|经历|客户)|\bI (?:personally|have|once|used to)\b/iu;
  return !experiencePattern.test(before) && experiencePattern.test(after);
}

export function acceptEditedCandidate(
  request: EditRequest,
  candidate: {
    text: string;
    reasons: string[];
    vendorMethod: string;
  }
): EditedRevision {
  if (!request.allowVendorCall) {
    throw new ContentFactoryError({
      code: "EDIT_AUTOMATION_EXHAUSTED",
      message: "automatic edit rounds are exhausted; human review is required",
      retryable: false
    });
  }

  const text = candidate.text.trim();
  const findings: EditFinding[] = analyzeProtectedFacts(request.originalText, text)
    .map(item => ({ ...item }));

  for (const violation of validateProtectedTerms(
    request.originalText,
    text,
    {
      profileId: "edit-policy",
      revision: 1,
      style: request.style,
      protectedTerms: request.protectedTerms,
      blockedPhrases: request.blockedPhrases,
      sourceSampleCount: 0,
      fingerprint: "0".repeat(64)
    }
  )) {
    findings.push({
      kind: "protected-term",
      before: `${violation.term} x${violation.beforeCount}`,
      after: `${violation.term} x${violation.afterCount}`,
      severity: "blocking"
    });
  }

  if (introducedFirstPersonExperience(request.originalText, text)) {
    findings.push({
      kind: "fabricated-first-person",
      before: "",
      after: "new first-person experience language detected",
      severity: "blocking"
    });
  }

  if (/[\u200B-\u200D\u2060\uFEFF]/u.test(text)) {
    findings.push({
      kind: "text-obfuscation",
      before: "",
      after: "zero-width character detected",
      severity: "blocking"
    });
  }

  const beforeSha256 = sha256(request.originalText);
  const afterSha256 = sha256(text);
  const vendorMethod = candidate.vendorMethod.trim();
  if (!vendorMethod) {
    throw new ContentFactoryError({
      code: "EDIT_VENDOR_REQUIRED",
      message: "vendor edit method identity is required",
      retryable: false
    });
  }

  return {
    kind: "edited",
    text,
    vendorMethod,
    intensity: request.intensity,
    round: request.round + 1,
    status: findings.length === 0 ? "accepted" : "review-required",
    findings,
    reasons: [...candidate.reasons],
    diff: {
      changed: beforeSha256 !== afterSha256,
      beforeSha256,
      afterSha256
    },
    fingerprint: sha256(JSON.stringify({
      text,
      vendorMethod,
      intensity: request.intensity,
      round: request.round + 1,
      findings
    }))
  };
}
