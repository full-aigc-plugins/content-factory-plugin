import { ContentFactoryError } from "../errors.ts";
import type { ReleaseBundle } from "./prepare.ts";

export type DeliveryIntent = {
  intentId: string;
  bundleId: string;
  bundleHash: string;
  targetAccountAlias: string;
  deliveryMethod: "api-draft" | "local-export";
  status: "prepared";
  remoteWriteAuthorized: false;
};

export function createDeliveryIntent(input: {
  intentId: string;
  bundle: ReleaseBundle;
  preflight: {
    status: "blocked" | "ready";
    accountAlias: string;
    deliveryMethod: "api-draft" | "local-export";
  };
}): DeliveryIntent {
  if (input.bundle.packageStatus !== "verified") {
    throw new ContentFactoryError({
      code: "DELIVERY_BUNDLE_NOT_VERIFIED",
      message: "working package cannot create a verified delivery intent",
      retryable: false
    });
  }
  if (input.preflight.status !== "ready") {
    throw new ContentFactoryError({
      code: "DELIVERY_PREFLIGHT_NOT_READY",
      message: "delivery preflight must be ready before intent creation",
      retryable: false
    });
  }
  if (input.preflight.accountAlias !== input.bundle.targetAccountAlias) {
    throw new ContentFactoryError({
      code: "DELIVERY_ACCOUNT_MISMATCH",
      message: "preflight account must match the frozen bundle account",
      retryable: false
    });
  }
  return {
    intentId: input.intentId,
    bundleId: input.bundle.bundleId,
    bundleHash: input.bundle.bundleHash,
    targetAccountAlias: input.bundle.targetAccountAlias,
    deliveryMethod: input.preflight.deliveryMethod,
    status: "prepared",
    remoteWriteAuthorized: false
  };
}
