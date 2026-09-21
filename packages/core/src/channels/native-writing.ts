import { createHash } from "node:crypto";

import { ContentFactoryError } from "../errors.ts";
import {
  validateProtectedTerms,
  type AuthorProfile
} from "../content/author-profile.ts";
import type { ClaimRecord, ClaimRegistry } from "../content/claims.ts";
import { analyzeProtectedFacts } from "../review/facts.ts";
import { resolveChannelRecipe, type ChannelRegistry } from "./registry.ts";

export type NativeWritingTarget = {
  channelId: string;
  formatId: string;
  locale: string;
};

export type RestrictedWritingContext = {
  privateAuthorFacts: string[];
  sourceAnecdotes: string[];
  unsupportedVendorClaims: string[];
};

export type NativeOutputContract = {
  id: string;
  requiredSections: string[];
};

export type NativeWritingRequest = {
  variantId: string;
  lineage: {
    sourceBundleId: string;
    siblingGroupId: string;
  };
  target: NativeWritingTarget;
  profileRef: string;
  recipeRef: string;
  stages: string[];
  outputContract: NativeOutputContract;
  claims: ClaimRecord[];
  authoringContext: {
    style: AuthorProfile["style"];
    protectedTerms: string[];
    blockedPhrases: string[];
  };
  exclusionPolicy: {
    privateAuthorFacts: "omit";
    sourceAnecdotes: "omit-unless-authorized";
    unsupportedVendorClaims: "omit";
  };
  executionBoundary: {
    action: "author";
    candidateOnly: true;
    remoteDeliveryAllowed: false;
  };
};

export type NativeCandidate = {
  channelId: string;
  formatId: string;
  sections: string[];
  text: string;
  claimRenderings: Array<{
    claimId: string;
    text: string;
  }>;
};

export type AcceptedNativeCandidate = {
  status: "review-required";
  variantId: string;
  target: NativeWritingTarget;
  text: string;
  sections: string[];
  claimIds: string[];
  detectionStatus: "required";
  approvalStatus: "required";
  fingerprint: string;
};

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function requiredSections(formatId: string): string[] {
  if (formatId === "answer") {
    return ["direct-answer", "reasoning", "limitations", "sources"];
  }
  if (formatId === "thread") {
    return ["opening", "posts", "closing", "sources"];
  }
  if (/script$/u.test(formatId)) {
    return ["hook", "spoken-beats", "subtitle-cues", "closing"];
  }
  if (formatId === "note") {
    return ["hook", "body", "takeaways", "tags"];
  }
  if (formatId.includes("article")) {
    return ["title", "lead", "sections", "sources"];
  }
  if (formatId.includes("carousel") || formatId === "document_copy") {
    return ["hook", "cards", "takeaways", "closing"];
  }
  return ["opening", "body", "closing", "sources"];
}

function copyClaims(registry: ClaimRegistry): ClaimRecord[] {
  return registry.claims.map(claim => ({
    ...claim,
    evidence: claim.evidence.map(evidence => ({ ...evidence }))
  }));
}

function throwNativeError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): never {
  throw new ContentFactoryError({
    code,
    message,
    retryable: false,
    ...(details === undefined ? {} : { details })
  });
}

export function createNativeWritingRequests(input: {
  sourceBundleId: string;
  claimRegistry: ClaimRegistry;
  authorProfile: AuthorProfile;
  registry: ChannelRegistry;
  targets: NativeWritingTarget[];
  restrictedContext: RestrictedWritingContext;
}): NativeWritingRequest[] {
  const sourceBundleId = input.sourceBundleId.trim();
  if (!sourceBundleId) {
    throwNativeError("NATIVE_SOURCE_BUNDLE_REQUIRED", "native writing requires a source bundle id");
  }
  if (input.targets.length === 0) {
    throwNativeError("NATIVE_TARGET_REQUIRED", "native writing requires at least one channel target");
  }

  const targetKeys = input.targets
    .map(target => `${target.channelId}/${target.formatId}/${target.locale}`)
    .sort((left, right) => left.localeCompare(right));
  const siblingGroupId = `siblings_${digest({
    sourceBundleId,
    profileId: input.authorProfile.profileId,
    profileRevision: input.authorProfile.revision,
    claimIds: input.claimRegistry.claims.map(claim => claim.claimId).sort(),
    targets: targetKeys
  }).slice(0, 24)}`;

  return input.targets.map(target => {
    const resolved = resolveChannelRecipe(input.registry, {
      channelId: target.channelId,
      formatId: target.formatId,
      requestedAction: "draft"
    });
    if (resolved.status !== "resolved") {
      throwNativeError(
        "NATIVE_RECIPE_UNAVAILABLE",
        "native writing requires a resolved channel recipe",
        { channelId: target.channelId, formatId: target.formatId, reason: resolved.reason }
      );
    }

    const variantId = `variant_${digest({
      siblingGroupId,
      channelId: target.channelId,
      formatId: target.formatId,
      locale: target.locale,
      recipeRevision: resolved.recipe.revision
    }).slice(0, 24)}`;
    return {
      variantId,
      lineage: { sourceBundleId, siblingGroupId },
      target: { ...target },
      profileRef: `${resolved.profile.id}@${resolved.profile.revision}`,
      recipeRef: `${resolved.recipe.channelId}/${resolved.recipe.formatId}@${resolved.recipe.revision}`,
      stages: [...resolved.recipe.stages],
      outputContract: {
        id: `native.${target.channelId}.${target.formatId}@${resolved.recipe.revision}`,
        requiredSections: requiredSections(target.formatId)
      },
      claims: copyClaims(input.claimRegistry),
      authoringContext: {
        style: {
          ...input.authorProfile.style,
          tone: [...input.authorProfile.style.tone]
        },
        protectedTerms: [...input.authorProfile.protectedTerms],
        blockedPhrases: [...input.authorProfile.blockedPhrases]
      },
      exclusionPolicy: {
        privateAuthorFacts: "omit",
        sourceAnecdotes: "omit-unless-authorized",
        unsupportedVendorClaims: "omit"
      },
      executionBoundary: {
        action: "author",
        candidateOnly: true,
        remoteDeliveryAllowed: false
      }
    };
  });
}

function restrictedValues(context: RestrictedWritingContext): Array<{
  kind: keyof RestrictedWritingContext;
  value: string;
}> {
  return (Object.entries(context) as Array<[
    keyof RestrictedWritingContext,
    string[]
  ]>).flatMap(([kind, values]) => values
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => ({ kind, value })));
}

export function acceptNativeCandidate(
  request: NativeWritingRequest,
  candidate: NativeCandidate,
  restrictedContext: RestrictedWritingContext
): AcceptedNativeCandidate {
  const text = candidate.text.trim();
  if (!text) {
    throwNativeError("NATIVE_TEXT_REQUIRED", "native candidate text is required");
  }
  if (
    candidate.channelId !== request.target.channelId
    || candidate.formatId !== request.target.formatId
  ) {
    throwNativeError("NATIVE_TARGET_MISMATCH", "native candidate target does not match its request");
  }
  if (JSON.stringify(candidate.sections) !== JSON.stringify(request.outputContract.requiredSections)) {
    throwNativeError(
      "NATIVE_STRUCTURE_MISMATCH",
      "native candidate does not satisfy the selected output contract",
      {
        expected: request.outputContract.requiredSections,
        actual: candidate.sections
      }
    );
  }

  const copiedContext = restrictedValues(restrictedContext)
    .find(item => text.includes(item.value));
  if (copiedContext !== undefined) {
    throwNativeError(
      "NATIVE_RESTRICTED_CONTEXT",
      "native candidate copied context that is excluded from the new author's voice",
      { kind: copiedContext.kind }
    );
  }
  const blockedPhrase = request.authoringContext.blockedPhrases
    .find(phrase => phrase && text.includes(phrase));
  if (blockedPhrase !== undefined) {
    throwNativeError(
      "NATIVE_BLOCKED_PHRASE",
      "native candidate contains an author-profile blocked phrase",
      { phrase: blockedPhrase }
    );
  }

  const renderingIds = new Set<string>();
  for (const rendering of candidate.claimRenderings) {
    if (renderingIds.has(rendering.claimId)) {
      throwNativeError(
        "NATIVE_CLAIM_DUPLICATE",
        "native candidate contains a duplicate claim rendering",
        { claimId: rendering.claimId }
      );
    }
    renderingIds.add(rendering.claimId);
  }

  for (const claim of request.claims) {
    const rendering = candidate.claimRenderings.find(item => item.claimId === claim.claimId);
    if (rendering === undefined || !text.includes(rendering.text.trim())) {
      throwNativeError(
        "NATIVE_CLAIM_MISSING",
        "native candidate must preserve every selected shared claim",
        { claimId: claim.claimId }
      );
    }
    const factFindings = analyzeProtectedFacts(claim.statement, rendering.text);
    const termFindings = validateProtectedTerms(
      claim.statement,
      rendering.text,
      {
        profileId: request.profileRef,
        revision: 1,
        style: request.authoringContext.style,
        protectedTerms: request.authoringContext.protectedTerms,
        blockedPhrases: request.authoringContext.blockedPhrases,
        sourceSampleCount: 0,
        fingerprint: "request-snapshot"
      }
    );
    if (factFindings.length > 0 || termFindings.length > 0) {
      throwNativeError(
        "NATIVE_PROTECTED_FACT_CHANGED",
        "native candidate changed a protected fact or terminology",
        {
          claimId: claim.claimId,
          factKinds: factFindings.map(item => item.kind),
          terms: termFindings.map(item => item.term)
        }
      );
    }
  }

  const expectedClaimIds = new Set(request.claims.map(claim => claim.claimId));
  const unknownClaim = candidate.claimRenderings.find(item => !expectedClaimIds.has(item.claimId));
  if (unknownClaim !== undefined) {
    throwNativeError(
      "NATIVE_CLAIM_UNKNOWN",
      "native candidate references a claim outside the shared registry",
      { claimId: unknownClaim.claimId }
    );
  }

  const claimIds = request.claims.map(claim => claim.claimId);
  return {
    status: "review-required",
    variantId: request.variantId,
    target: { ...request.target },
    text,
    sections: [...candidate.sections],
    claimIds,
    detectionStatus: "required",
    approvalStatus: "required",
    fingerprint: digest({
      variantId: request.variantId,
      recipeRef: request.recipeRef,
      outputContract: request.outputContract.id,
      text,
      sections: candidate.sections,
      claimIds
    })
  };
}
