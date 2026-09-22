export type ChannelDeliveryAction = "read" | "export" | "draft" | "publish";

export type ChannelDeliveryCapability = {
  capabilityId: string;
  channelId: string;
  formatIds: string[];
  accountAlias: string;
  adapterId: string;
  actions: ChannelDeliveryAction[];
  contractVerified: boolean;
  liveVerified: boolean;
};

export type ChannelActionRequest = {
  channelId: string;
  formatId: string;
  accountAlias: string;
  adapterId: string;
  action: ChannelDeliveryAction;
  bundleHash: string;
};

export type ChannelActionApproval = {
  actorKind: "human" | "agent" | "system";
  trusted: boolean;
  channelId: string;
  formatId: string;
  accountAlias: string;
  action: ChannelDeliveryAction;
  bundleHash: string;
};

export type ChannelActionDecision =
  | {
    status: "allowed";
    action: ChannelDeliveryAction;
    remoteWrite: boolean;
    requiresReadback: boolean;
    requiresUnknownWriteReconciliation: boolean;
    workingExportAllowed: true;
  }
  | {
    status: "blocked";
    action: ChannelDeliveryAction;
    reason: string;
    remoteWrite: false;
    requiresReadback: false;
    requiresUnknownWriteReconciliation: false;
    workingExportAllowed: true;
  };

function blocked(action: ChannelDeliveryAction, reason: string): ChannelActionDecision {
  return {
    status: "blocked",
    action,
    reason,
    remoteWrite: false,
    requiresReadback: false,
    requiresUnknownWriteReconciliation: false,
    workingExportAllowed: true
  };
}

export function authorizeChannelAction(input: {
  capability: ChannelDeliveryCapability;
  request: ChannelActionRequest;
  approval: ChannelActionApproval | null;
  executeRemote?: () => unknown;
}): ChannelActionDecision {
  const { capability, request, approval } = input;
  if (!capability.contractVerified) {
    return blocked(request.action, "capability-contract-unverified");
  }
  if (capability.channelId !== request.channelId) {
    return blocked(request.action, "channel-not-granted");
  }
  if (!capability.formatIds.includes(request.formatId)) {
    return blocked(request.action, "format-not-granted");
  }
  if (capability.accountAlias !== request.accountAlias) {
    return blocked(request.action, "account-not-granted");
  }
  if (capability.adapterId !== request.adapterId) {
    return blocked(request.action, "adapter-not-granted");
  }
  if (!capability.actions.includes(request.action)) {
    return blocked(request.action, "action-not-granted");
  }

  const remoteAccess = request.action !== "export";
  if (remoteAccess && !capability.liveVerified) {
    return blocked(request.action, "capability-not-live-verified");
  }

  const remoteWrite = request.action === "draft" || request.action === "publish";
  if (remoteWrite) {
    if (approval?.actorKind !== "human" || !approval.trusted) {
      return blocked(request.action, "human-approval-required");
    }
    if (approval.channelId !== request.channelId
        || approval.formatId !== request.formatId
        || approval.accountAlias !== request.accountAlias
        || approval.action !== request.action
        || approval.bundleHash !== request.bundleHash) {
      return blocked(request.action, "approval-mismatch");
    }
  }

  const draft = request.action === "draft";
  return {
    status: "allowed",
    action: request.action,
    remoteWrite,
    requiresReadback: draft,
    requiresUnknownWriteReconciliation: draft,
    workingExportAllowed: true
  };
}
