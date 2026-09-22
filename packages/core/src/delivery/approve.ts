import { ContentFactoryError } from "../errors.ts";
import type { DeliveryIntent } from "./intents.ts";
import type { ReleaseBundle } from "./prepare.ts";

export type DeliveryApproval = {
  intentId: string;
  bundleHash: string;
  targetAccountAlias: string;
  actorKind: "human" | "trusted-system";
  actorId: string;
  approvedAt: string;
  remoteWriteAuthorized: true;
};

export function approveDeliveryIntent(input: {
  intent: DeliveryIntent;
  actor: { kind: "human" | "trusted-system" | "model"; id: string };
  interactionTrusted: boolean;
  approvedAt: string;
}): DeliveryApproval {
  if (input.actor.kind === "model") {
    throw new ContentFactoryError({
      code: "DELIVERY_APPROVAL_ACTOR_UNTRUSTED",
      message: "a model cannot approve remote delivery",
      retryable: false
    });
  }
  if (!input.interactionTrusted) {
    throw new ContentFactoryError({
      code: "DELIVERY_APPROVAL_CHANNEL_UNTRUSTED",
      message: "remote delivery approval requires a trusted interaction channel",
      retryable: false
    });
  }
  if (input.actor.id.trim() === "") {
    throw new ContentFactoryError({
      code: "DELIVERY_APPROVAL_ACTOR_MISSING",
      message: "remote delivery approval requires an actor identity",
      retryable: false
    });
  }
  return {
    intentId: input.intent.intentId,
    bundleHash: input.intent.bundleHash,
    targetAccountAlias: input.intent.targetAccountAlias,
    actorKind: input.actor.kind,
    actorId: input.actor.id,
    approvedAt: input.approvedAt,
    remoteWriteAuthorized: true
  };
}

export function validateApprovedDelivery(input: {
  intent: DeliveryIntent;
  approval: DeliveryApproval;
  currentBundle: ReleaseBundle;
}): { allowed: boolean; reason: string | null } {
  if (input.approval.intentId !== input.intent.intentId
      || input.approval.bundleHash !== input.intent.bundleHash
      || input.approval.targetAccountAlias !== input.intent.targetAccountAlias) {
    return { allowed: false, reason: "approval-intent-mismatch" };
  }
  if (input.currentBundle.bundleHash !== input.intent.bundleHash
      || input.currentBundle.targetAccountAlias !== input.intent.targetAccountAlias) {
    return { allowed: false, reason: "bundle-changed-after-approval" };
  }
  return { allowed: true, reason: null };
}
