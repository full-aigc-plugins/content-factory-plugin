import { createHash } from "node:crypto";

export type ReleaseAsset = {
  artifactId: string;
  sha256: string;
  order: number;
};

export type ReleaseBundle = {
  bundleId: string;
  variantRef: string;
  contentRevisionId: string;
  packageStatus: "working" | "verified";
  targetAccountAlias: string;
  title: string;
  summary: string;
  body: string;
  assets: ReleaseAsset[];
  detectionReviewRef: string;
  bundleHash: string;
};

export function prepareReleaseBundle(
  input: Omit<ReleaseBundle, "bundleHash">
): ReleaseBundle {
  const assets = input.assets
    .map(asset => ({ ...asset }))
    .sort((left, right) => left.order - right.order
      || left.artifactId.localeCompare(right.artifactId));
  const logicalBundle = {
    bundleId: input.bundleId,
    variantRef: input.variantRef,
    contentRevisionId: input.contentRevisionId,
    packageStatus: input.packageStatus,
    targetAccountAlias: input.targetAccountAlias,
    title: input.title,
    summary: input.summary,
    body: input.body,
    assets,
    detectionReviewRef: input.detectionReviewRef
  };
  const bundleHash = createHash("sha256")
    .update(JSON.stringify(logicalBundle), "utf8")
    .digest("hex");
  return { ...logicalBundle, bundleHash };
}
