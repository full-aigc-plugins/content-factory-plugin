import { ContentFactoryError } from "../errors.ts";
import type { PolicyVerdict } from "../detection/policy.ts";

export type DetectionReviewDecision = {
  actorKind: "human" | "trusted-system";
  actorId: string;
  action: "approve" | "reject" | "accept-exception";
  reason: string;
  policyVersion: string;
  decidedAt: string;
};

export type ReviewedDetectionPolicy = {
  policyVerdict: PolicyVerdict;
  reviewDecision: DetectionReviewDecision;
};

export function recordDetectionReview(input: {
  policyVerdict: PolicyVerdict;
  actor: { kind: "human" | "trusted-system" | "model"; id: string };
  action: DetectionReviewDecision["action"];
  reason: string;
  policyVersion: string;
  decidedAt: string;
}): ReviewedDetectionPolicy {
  if (input.actor.kind === "model") {
    throw new ContentFactoryError({
      code: "DETECTION_REVIEW_ACTOR_UNTRUSTED",
      message: "a model cannot approve its own detection review",
      retryable: false
    });
  }
  if (input.policyVersion !== input.policyVerdict.policyVersion) {
    throw new ContentFactoryError({
      code: "DETECTION_POLICY_VERSION_MISMATCH",
      message: "review decision must bind the evaluated policy version",
      retryable: false
    });
  }
  if (input.actor.id.trim() === "" || input.reason.trim() === "") {
    throw new ContentFactoryError({
      code: "DETECTION_REVIEW_INCOMPLETE",
      message: "review decision requires an actor and reason",
      retryable: false
    });
  }
  if (input.policyVerdict.verdict === "not-evaluable"
      && input.action !== "reject") {
    throw new ContentFactoryError({
      code: "DETECTION_REVIEW_NOT_EVALUABLE",
      message: "an unevaluable detector result cannot be approved",
      retryable: false
    });
  }
  if (input.policyVerdict.verdict === "not-met"
      && input.action === "approve") {
    throw new ContentFactoryError({
      code: "DETECTION_EXCEPTION_REQUIRED",
      message: "a not-met verdict requires an explicit exception decision",
      retryable: false
    });
  }

  return {
    policyVerdict: {
      ...input.policyVerdict,
      thresholds: input.policyVerdict.thresholds
        ? { ...input.policyVerdict.thresholds }
        : null,
      reasons: [...input.policyVerdict.reasons]
    },
    reviewDecision: {
      actorKind: input.actor.kind,
      actorId: input.actor.id,
      action: input.action,
      reason: input.reason,
      policyVersion: input.policyVersion,
      decidedAt: input.decidedAt
    }
  };
}
