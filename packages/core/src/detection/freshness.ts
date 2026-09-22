import { createHash } from "node:crypto";

export type DetectionBinding = {
  runId: string;
  textHash: string;
  canonicalizationVersion: string;
  requestConfigHash: string;
  presentationHash: string;
  accountRef: string;
  providerModelVersion: string | null;
  createdAt: string;
  expiresAt: string;
};

export type DetectionFreshness = {
  detectionReusable: boolean;
  deliveryReviewRequired: boolean;
  reasons: string[];
};

export function buildDetectionRequestKey(
  input: Pick<DetectionBinding,
    "runId" | "textHash" | "canonicalizationVersion" | "requestConfigHash">
): string {
  const identity = JSON.stringify([
    input.runId,
    input.textHash,
    input.canonicalizationVersion,
    input.requestConfigHash
  ]);
  return createHash("sha256").update(identity, "utf8").digest("hex");
}

export function evaluateDetectionFreshness(input: {
  binding: DetectionBinding;
  current: DetectionBinding;
  now: string;
}): DetectionFreshness {
  const { binding, current } = input;
  const reasons: string[] = [];
  let reusable = true;

  const invalidate = (reason: string): void => {
    reasons.push(reason);
    reusable = false;
  };

  if (binding.runId !== current.runId) invalidate("cross-run-reuse-denied");
  if (binding.textHash !== current.textHash) invalidate("canonical-text-changed");
  if (binding.canonicalizationVersion !== current.canonicalizationVersion) {
    invalidate("canonicalization-version-changed");
  }
  if (binding.requestConfigHash !== current.requestConfigHash) {
    invalidate("request-config-changed");
  }
  if (binding.providerModelVersion !== current.providerModelVersion) {
    invalidate("provider-model-version-changed");
  }

  const now = Date.parse(input.now);
  const expiresAt = Date.parse(binding.expiresAt);
  if (!Number.isFinite(now) || !Number.isFinite(expiresAt) || now >= expiresAt) {
    invalidate("report-expired");
  }

  let deliveryReviewRequired = !reusable;
  if (binding.presentationHash !== current.presentationHash) {
    reasons.push("presentation-changed");
    deliveryReviewRequired = true;
  }
  if (binding.accountRef !== current.accountRef) {
    reasons.push("delivery-account-changed");
    deliveryReviewRequired = true;
  }

  return {
    detectionReusable: reusable,
    deliveryReviewRequired,
    reasons
  };
}
