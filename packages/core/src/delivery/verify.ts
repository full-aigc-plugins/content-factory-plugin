import type { WorkspaceStore } from "../workspace/store.ts";
import type { ReleaseBundle } from "./prepare.ts";

export type RemoteDraft = {
  remoteDraftId: string;
  title: string;
  summary: string;
  body: string;
  remoteAssetIds: string[];
};

export type DraftDifference = {
  field: "title" | "summary" | "body" | "remoteAssetIds";
  expected: string | string[];
  actual: string | string[];
};

export type DraftVerification = {
  status: "verified" | "conflict" | "unknown";
  remoteDraftId: string | null;
  differences: DraftDifference[];
};

function normalizeLineEndings(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function verifyDraftReadback(input: {
  bundle: ReleaseBundle;
  expectedRemoteAssetIds: string[];
  remoteDraft: RemoteDraft;
}): DraftVerification {
  const differences: DraftDifference[] = [];
  const compareText = (
    field: "title" | "summary" | "body",
    expected: string,
    actual: string
  ): void => {
    if (normalizeLineEndings(expected) !== normalizeLineEndings(actual)) {
      differences.push({ field, expected, actual });
    }
  };
  compareText("title", input.bundle.title, input.remoteDraft.title);
  compareText("summary", input.bundle.summary, input.remoteDraft.summary);
  compareText("body", input.bundle.body, input.remoteDraft.body);
  if (JSON.stringify(input.expectedRemoteAssetIds)
      !== JSON.stringify(input.remoteDraft.remoteAssetIds)) {
    differences.push({
      field: "remoteAssetIds",
      expected: [...input.expectedRemoteAssetIds],
      actual: [...input.remoteDraft.remoteAssetIds]
    });
  }
  return {
    status: differences.length === 0 ? "verified" : "conflict",
    remoteDraftId: input.remoteDraft.remoteDraftId,
    differences
  };
}

export async function reconcileUnknownDraft(input: {
  store: WorkspaceStore;
  intentId: string;
  bundle: ReleaseBundle;
  port: { findByClientRequest(requestId: string): Promise<RemoteDraft[]> };
  now?: () => string;
}): Promise<DraftVerification> {
  const submission = input.store.getDeliverySubmission(input.intentId);
  if (!submission || submission.status !== "unknown") {
    return { status: "unknown", remoteDraftId: null, differences: [] };
  }
  const matches = await input.port.findByClientRequest(submission.requestId);
  if (matches.length !== 1) {
    return { status: "unknown", remoteDraftId: null, differences: [] };
  }
  const expectedRemoteAssetIds: string[] = [];
  for (const asset of input.bundle.assets) {
    const mapping = input.store.getDeliveryAssetMap(input.intentId, asset.artifactId);
    if (!mapping || mapping.sha256 !== asset.sha256) {
      return { status: "unknown", remoteDraftId: null, differences: [] };
    }
    expectedRemoteAssetIds.push(mapping.remoteAssetId);
  }
  const verification = verifyDraftReadback({
    bundle: input.bundle,
    expectedRemoteAssetIds,
    remoteDraft: matches[0]
  });
  input.store.updateDeliverySubmission({
    intentId: input.intentId,
    status: verification.status === "verified" ? "succeeded" : "conflict",
    remoteDraftId: matches[0].remoteDraftId,
    reason: verification.status === "verified" ? null : "remote-draft-conflict",
    updatedAt: (input.now ?? (() => new Date().toISOString()))()
  });
  return verification;
}
