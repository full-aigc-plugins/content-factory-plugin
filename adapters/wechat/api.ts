import type { DraftDeliveryPort } from "../../packages/core/src/delivery/submit.ts";

export type OfficialContentDraftTransport = {
  request(
    action: "asset-upload" | "draft-create",
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
};

export function createOfficialContentDraftApi(
  transport: OfficialContentDraftTransport
): DraftDeliveryPort {
  return {
    async uploadAsset(asset) {
      const response = await transport.request("asset-upload", { ...asset });
      if (typeof response.remoteAssetId !== "string") {
        throw new Error("asset upload response missing remote asset identity");
      }
      return { remoteAssetId: response.remoteAssetId };
    },
    async createDraft(input) {
      const response = await transport.request("draft-create", { ...input });
      if (typeof response.remoteDraftId !== "string") {
        throw new Error("draft response missing remote draft identity");
      }
      return { remoteDraftId: response.remoteDraftId };
    }
  };
}
