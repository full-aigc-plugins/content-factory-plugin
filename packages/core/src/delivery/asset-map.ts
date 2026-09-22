import type { WorkspaceStore } from "../workspace/store.ts";
import type { ReleaseAsset } from "./prepare.ts";

export function findRemoteAsset(
  store: WorkspaceStore,
  intentId: string,
  asset: ReleaseAsset
) {
  const mapping = store.getDeliveryAssetMap(intentId, asset.artifactId);
  return mapping?.sha256 === asset.sha256 ? mapping : null;
}

export function bindRemoteAsset(
  store: WorkspaceStore,
  intentId: string,
  asset: ReleaseAsset,
  remoteAssetId: string,
  createdAt: string
) {
  return store.putDeliveryAssetMap({
    intentId,
    artifactId: asset.artifactId,
    sha256: asset.sha256,
    remoteAssetId,
    createdAt
  });
}
