import {
  validateApprovedDelivery,
  type DeliveryApproval
} from "../../packages/core/src/delivery/approve.ts";
import type { DeliveryIntent } from "../../packages/core/src/delivery/intents.ts";
import type { ReleaseBundle } from "../../packages/core/src/delivery/prepare.ts";
import {
  verifyDraftReadback,
  type DraftDifference,
  type RemoteDraft
} from "../../packages/core/src/delivery/verify.ts";

export type ControlledBrowserCapability = {
  status: "available" | "unavailable" | "unknown";
  browserName: string | null;
};

export type BrowserOperatingSystemSupport = {
  name: string;
  status: "supported" | "unsupported" | "unknown";
};

export type BrowserDraftEvidence = {
  phase: "filled" | "saved" | "verified";
  evidenceRef: string;
};

export type ControlledDraftBrowserPort = {
  inspectSession(input: {
    selectedAccountAlias: string;
  }): Promise<{
    status: "ready" | "expired" | "verification-required";
    accountAlias: string;
    evidenceRef: string;
  }>;
  fillDraft(input: {
    title: string;
    summary: string;
    body: string;
    remoteAssetIds: string[];
  }): Promise<{
    status: "filled" | "editor-structure-changed";
    evidenceRef: string;
  }>;
  saveDraft(input: {
    action: "save-draft";
  }): Promise<{
    status: "saved" | "editor-structure-changed";
    remoteDraftId?: string;
    evidenceRef: string;
  }>;
  readDraft(input: {
    remoteDraftId: string;
  }): Promise<RemoteDraft | null>;
};

export type ControlledDraftBrowserResult = {
  status: "blocked" | "recoverable" | "saved" | "verified" | "conflict";
  reason: string | null;
  remoteDraftId: string | null;
  evidence: BrowserDraftEvidence[];
  differences: DraftDifference[];
};

function stopped(
  status: "blocked" | "recoverable",
  reason: string
): ControlledDraftBrowserResult {
  return {
    status,
    reason,
    remoteDraftId: null,
    evidence: [],
    differences: []
  };
}

export async function runControlledDraftBrowser(input: {
  bundle: ReleaseBundle;
  intent: DeliveryIntent;
  approval: DeliveryApproval;
  selectedAccountAlias: string;
  action: string;
  capability: ControlledBrowserCapability;
  operatingSystem: BrowserOperatingSystemSupport;
  expectedRemoteAssetIds: string[];
  port: ControlledDraftBrowserPort;
}): Promise<ControlledDraftBrowserResult> {
  if (input.capability.status !== "available") {
    return stopped("blocked", `browser-capability-${input.capability.status}`);
  }
  if (input.operatingSystem.status !== "supported") {
    return stopped("blocked", `operating-system-${input.operatingSystem.status}`);
  }
  if (input.selectedAccountAlias !== input.bundle.targetAccountAlias) {
    return stopped("blocked", "selected-account-mismatch");
  }
  if (input.action !== "save-draft") {
    return stopped("blocked", "unsupported-browser-action");
  }
  const authorization = validateApprovedDelivery({
    intent: input.intent,
    approval: input.approval,
    currentBundle: input.bundle
  });
  if (!authorization.allowed) {
    return stopped("blocked", authorization.reason ?? "approval-not-valid");
  }

  const session = await input.port.inspectSession({
    selectedAccountAlias: input.selectedAccountAlias
  });
  if (session.status !== "ready") {
    return stopped("recoverable", session.status);
  }
  if (session.accountAlias !== input.selectedAccountAlias) {
    return stopped("recoverable", "active-account-mismatch");
  }

  const filled = await input.port.fillDraft({
    title: input.bundle.title,
    summary: input.bundle.summary,
    body: input.bundle.body,
    remoteAssetIds: [...input.expectedRemoteAssetIds]
  });
  if (filled.status !== "filled") {
    return stopped("recoverable", filled.status);
  }
  const evidence: BrowserDraftEvidence[] = [{
    phase: "filled",
    evidenceRef: filled.evidenceRef
  }];

  const saved = await input.port.saveDraft({ action: "save-draft" });
  if (saved.status !== "saved" || !saved.remoteDraftId) {
    return {
      status: "recoverable",
      reason: saved.status === "saved" ? "draft-id-missing" : saved.status,
      remoteDraftId: null,
      evidence,
      differences: []
    };
  }
  evidence.push({ phase: "saved", evidenceRef: saved.evidenceRef });

  const remoteDraft = await input.port.readDraft({
    remoteDraftId: saved.remoteDraftId
  });
  if (!remoteDraft) {
    return {
      status: "saved",
      reason: "readback-unavailable",
      remoteDraftId: saved.remoteDraftId,
      evidence,
      differences: []
    };
  }
  const verification = verifyDraftReadback({
    bundle: input.bundle,
    expectedRemoteAssetIds: input.expectedRemoteAssetIds,
    remoteDraft
  });
  if (verification.status === "conflict") {
    return {
      status: "conflict",
      reason: "readback-conflict",
      remoteDraftId: saved.remoteDraftId,
      evidence,
      differences: verification.differences
    };
  }
  evidence.push({
    phase: "verified",
    evidenceRef: `readback:${saved.remoteDraftId}`
  });
  return {
    status: "verified",
    reason: null,
    remoteDraftId: saved.remoteDraftId,
    evidence,
    differences: []
  };
}
