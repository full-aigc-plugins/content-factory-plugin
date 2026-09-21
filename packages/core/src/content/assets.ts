import { createHash } from "node:crypto";

export type AssetKind = "user-image" | "screenshot" | "licensed" | "generated";
export type AssetRisk =
  | "invalid-image"
  | "mime-mismatch"
  | "dimensions-over-budget"
  | "missing-usage-note"
  | "unclear-rights";

export type AssetRecord = {
  assetId: string;
  kind: AssetKind;
  generated: boolean;
  mimeType: string;
  sha256: string;
  bytes: number;
  dimensions: { width: number; height: number } | null;
  usageNote: string;
  rights: { basis: string; owner?: string; license?: string };
  integrity: { status: "valid" | "invalid" };
  risks: AssetRisk[];
};

export type VisualBrief = {
  briefId: string;
  revisionId: string;
  anchor: string;
  purpose: string;
  assetKind: string;
  aspectRatio?: string;
  textConstraints: string[];
  sourceRefs: string[];
  generationStatus: "not-requested";
};

function inspectImage(bytes: Buffer): {
  mimeType: "image/png" | "image/jpeg" | null;
  dimensions: { width: number; height: number } | null;
} {
  const isPng = bytes.length >= 24 && bytes.subarray(0, 8).equals(
    Buffer.from("89504e470d0a1a0a", "hex")
  );
  if (isPng) {
    return {
      mimeType: "image/png",
      dimensions: {
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20)
      }
    };
  }

  const isJpeg = bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff;
  return {
    mimeType: isJpeg ? "image/jpeg" : null,
    dimensions: null
  };
}

export function createAssetRecord(input: {
  assetId: string;
  declaredKind: AssetKind;
  bytes: Buffer;
  mimeType: string;
  usageNote: string;
  rights: { basis: string; owner?: string; license?: string };
  limits?: { maxWidth: number; maxHeight: number };
}): AssetRecord {
  const inspected = inspectImage(input.bytes);
  const risks: AssetRisk[] = [];

  if (inspected.mimeType === null) {
    risks.push("invalid-image");
  } else if (inspected.mimeType !== input.mimeType) {
    risks.push("mime-mismatch");
  }
  if (input.usageNote.trim().length === 0) {
    risks.push("missing-usage-note");
  }
  if (input.rights.basis === "unknown") {
    risks.push("unclear-rights");
  }
  if (
    inspected.dimensions !== null
    && input.limits !== undefined
    && (inspected.dimensions.width > input.limits.maxWidth
      || inspected.dimensions.height > input.limits.maxHeight)
  ) {
    risks.push("dimensions-over-budget");
  }

  return {
    assetId: input.assetId,
    kind: input.declaredKind,
    generated: input.declaredKind === "generated",
    mimeType: input.mimeType,
    sha256: createHash("sha256").update(input.bytes).digest("hex"),
    bytes: input.bytes.length,
    dimensions: inspected.dimensions,
    usageNote: input.usageNote,
    rights: { ...input.rights },
    integrity: { status: risks.includes("invalid-image") ? "invalid" : "valid" },
    risks
  };
}

export function createVisualBrief(input: {
  briefId: string;
  revisionId: string;
  anchor: string;
  purpose: string;
  assetKind: string;
  aspectRatio?: string;
  textConstraints?: string[];
  sourceRefs?: string[];
}): VisualBrief {
  return {
    briefId: input.briefId,
    revisionId: input.revisionId,
    anchor: input.anchor,
    purpose: input.purpose,
    assetKind: input.assetKind,
    ...(input.aspectRatio === undefined ? {} : { aspectRatio: input.aspectRatio }),
    textConstraints: [...(input.textConstraints ?? [])],
    sourceRefs: [...(input.sourceRefs ?? [])],
    generationStatus: "not-requested"
  };
}

export function evaluateVisualStrategy(input: {
  requiredBriefs: number;
  fulfilledAssets: number;
  explicitNoImage: boolean;
}): { workDraftAllowed: true; formalReady: boolean; reason: string } {
  if (input.fulfilledAssets >= input.requiredBriefs) {
    return { workDraftAllowed: true, formalReady: true, reason: "visuals-ready" };
  }
  if (input.explicitNoImage) {
    return { workDraftAllowed: true, formalReady: true, reason: "explicit-no-image" };
  }
  return { workDraftAllowed: true, formalReady: false, reason: "visuals-pending" };
}
