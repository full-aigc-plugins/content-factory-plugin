import type { DeliveryAccount } from "./accounts.ts";
import type { LayeredSecretProvider } from "../security/credentials.ts";

export type DeliveryPreflightResult = {
  status: "blocked" | "ready";
  reason: string | null;
  accountAlias: string;
  deliveryMethod: DeliveryAccount["deliveryMethod"];
  credentialSource: "system" | "environment" | null;
  missingPermissions: string[];
};

export async function preflightDeliveryAccount(input: {
  account: DeliveryAccount;
  approvedAccountAlias: string;
  requiredPermissions: string[];
  credentialProvider: LayeredSecretProvider;
  probe: (input: { secret: string }) => Promise<{
    remoteAccountId: string;
    permissions: string[];
  }>;
}): Promise<DeliveryPreflightResult> {
  const base = {
    accountAlias: input.account.alias,
    deliveryMethod: input.account.deliveryMethod
  };
  if (input.approvedAccountAlias !== input.account.alias) {
    return {
      ...base,
      status: "blocked",
      reason: "account-approval-required",
      credentialSource: null,
      missingPermissions: []
    };
  }

  const credential = await input.credentialProvider.resolve(input.account.credentialRef);
  if (credential.status === "unavailable") {
    return {
      ...base,
      status: "blocked",
      reason: "credential-unavailable",
      credentialSource: null,
      missingPermissions: []
    };
  }

  let probed;
  try {
    probed = await input.probe({ secret: credential.secret });
  } catch {
    return {
      ...base,
      status: "blocked",
      reason: "account-probe-failed",
      credentialSource: credential.source,
      missingPermissions: []
    };
  }
  if (probed.remoteAccountId !== input.account.expectedRemoteAccountId) {
    return {
      ...base,
      status: "blocked",
      reason: "remote-account-mismatch",
      credentialSource: credential.source,
      missingPermissions: []
    };
  }

  const granted = new Set(probed.permissions);
  const missingPermissions = [...new Set(input.requiredPermissions)]
    .filter(permission => !granted.has(permission));
  if (missingPermissions.length > 0) {
    return {
      ...base,
      status: "blocked",
      reason: "permission-missing",
      credentialSource: credential.source,
      missingPermissions
    };
  }

  return {
    ...base,
    status: "ready",
    reason: null,
    credentialSource: credential.source,
    missingPermissions: []
  };
}
