import type { WorkspaceStore } from "../workspace/store.ts";
import { validateApprovedDelivery, type DeliveryApproval } from "./approve.ts";
import { bindRemoteAsset, findRemoteAsset } from "./asset-map.ts";
import type { DeliveryIntent } from "./intents.ts";
import type { ReleaseAsset, ReleaseBundle } from "./prepare.ts";

export type DraftDeliveryPort = {
  uploadAsset(asset: ReleaseAsset): Promise<{ remoteAssetId: string }>;
  createDraft(input: {
    title: string;
    summary: string;
    body: string;
    remoteAssetIds: string[];
  }): Promise<{ remoteDraftId: string }>;
};

export type DraftSubmissionResult = {
  status: "failed" | "unknown" | "succeeded";
  reason: string | null;
  remoteDraftId: string | null;
  action: "draft-created" | null;
  deduplicated: boolean;
};

function outcomeUnknown(error: unknown): boolean {
  return error instanceof Error
    && "outcomeUnknown" in error
    && error.outcomeUnknown === true;
}

export async function submitApprovedDraft(input: {
  requestId: string;
  store: WorkspaceStore;
  bundle: ReleaseBundle;
  intent: DeliveryIntent;
  approval: DeliveryApproval;
  port: DraftDeliveryPort;
  now?: () => string;
}): Promise<DraftSubmissionResult> {
  const authorization = validateApprovedDelivery({
    intent: input.intent,
    approval: input.approval,
    currentBundle: input.bundle
  });
  if (!authorization.allowed) {
    return {
      status: "failed", reason: authorization.reason,
      remoteDraftId: null, action: null, deduplicated: false
    };
  }
  const now = input.now ?? (() => new Date().toISOString());
  let submission = input.store.createOrLoadDeliverySubmission({
    intentId: input.intent.intentId,
    bundleHash: input.intent.bundleHash,
    accountAlias: input.intent.targetAccountAlias,
    requestId: input.requestId,
    status: "prepared",
    remoteDraftId: null,
    reason: null,
    createdAt: now(),
    updatedAt: now()
  });
  if (submission.status === "succeeded") {
    return {
      status: "succeeded", reason: null,
      remoteDraftId: submission.remoteDraftId,
      action: "draft-created", deduplicated: true
    };
  }
  if (submission.status === "unknown") {
    return {
      status: "unknown", reason: "remote-draft-outcome-unknown",
      remoteDraftId: null, action: null, deduplicated: true
    };
  }
  if (submission.status === "conflict") {
    return {
      status: "failed", reason: "remote-draft-conflict",
      remoteDraftId: submission.remoteDraftId,
      action: null, deduplicated: true
    };
  }
  submission = input.store.updateDeliverySubmission({
    intentId: input.intent.intentId,
    status: "submitting",
    remoteDraftId: null,
    reason: null,
    updatedAt: now()
  });

  const remoteAssetIds: string[] = [];
  for (const asset of input.bundle.assets) {
    const existing = findRemoteAsset(input.store, input.intent.intentId, asset);
    if (existing) {
      remoteAssetIds.push(existing.remoteAssetId);
      continue;
    }
    try {
      const uploaded = await input.port.uploadAsset(asset);
      const persisted = bindRemoteAsset(
        input.store, input.intent.intentId, asset, uploaded.remoteAssetId, now()
      );
      remoteAssetIds.push(persisted.remoteAssetId);
    } catch {
      input.store.updateDeliverySubmission({
        intentId: input.intent.intentId,
        status: "failed",
        remoteDraftId: null,
        reason: "asset-upload-failed",
        updatedAt: now()
      });
      return {
        status: "failed", reason: "asset-upload-failed",
        remoteDraftId: null, action: null, deduplicated: false
      };
    }
  }

  try {
    const created = await input.port.createDraft({
      title: input.bundle.title,
      summary: input.bundle.summary,
      body: input.bundle.body,
      remoteAssetIds
    });
    input.store.updateDeliverySubmission({
      intentId: input.intent.intentId,
      status: "succeeded",
      remoteDraftId: created.remoteDraftId,
      reason: null,
      updatedAt: now()
    });
    return {
      status: "succeeded", reason: null,
      remoteDraftId: created.remoteDraftId,
      action: "draft-created", deduplicated: false
    };
  } catch (error) {
    const unknown = outcomeUnknown(error);
    input.store.updateDeliverySubmission({
      intentId: input.intent.intentId,
      status: unknown ? "unknown" : "failed",
      remoteDraftId: null,
      reason: unknown ? "remote-draft-outcome-unknown" : "draft-create-failed",
      updatedAt: now()
    });
    return {
      status: unknown ? "unknown" : "failed",
      reason: unknown ? "remote-draft-outcome-unknown" : "draft-create-failed",
      remoteDraftId: null,
      action: null,
      deduplicated: false
    };
  }
}
