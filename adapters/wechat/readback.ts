import type { RemoteDraft } from "../../packages/core/src/delivery/verify.ts";

export type OfficialContentReadbackTransport = {
  request(
    action: "find-drafts" | "read-draft",
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
};

function draft(value: unknown): RemoteDraft {
  if (typeof value !== "object" || value === null) {
    throw new Error("readback response is not an object");
  }
  const item = value as Record<string, unknown>;
  if (typeof item.remoteDraftId !== "string"
      || typeof item.title !== "string"
      || typeof item.summary !== "string"
      || typeof item.body !== "string"
      || !Array.isArray(item.remoteAssetIds)
      || !item.remoteAssetIds.every(id => typeof id === "string")) {
    throw new Error("readback response is missing required fields");
  }
  return {
    remoteDraftId: item.remoteDraftId,
    title: item.title,
    summary: item.summary,
    body: item.body,
    remoteAssetIds: [...item.remoteAssetIds] as string[]
  };
}

export function createOfficialContentReadbackApi(
  transport: OfficialContentReadbackTransport
) {
  return {
    async findByClientRequest(requestId: string): Promise<RemoteDraft[]> {
      const response = await transport.request("find-drafts", { requestId });
      if (!Array.isArray(response.drafts)) {
        throw new Error("find response missing drafts");
      }
      return response.drafts.map(draft);
    },
    async readDraft(remoteDraftId: string): Promise<RemoteDraft> {
      return draft(await transport.request("read-draft", { remoteDraftId }));
    }
  };
}
