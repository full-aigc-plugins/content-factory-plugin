import { ContentFactoryError } from "../errors.ts";
import {
  createVisualBrief,
  type VisualBrief
} from "../content/assets.ts";

export type ImageFactoryStatus = "available" | "unavailable" | "unknown";
export type ChannelMediaNeed = {
  needId: string;
  kind: "cover" | "card" | "video" | "audio";
  purpose: string;
  anchor: string;
  aspectRatio?: string;
  sourceRefs?: string[];
  scriptRef?: string;
};

export type ChannelMediaBrief = {
  schemaVersion: 1;
  briefId: string;
  variantRef: string;
  contentRevisionId: string;
  channelId: string;
  formatId: string;
  kind: "generated-image" | "external-video" | "external-audio";
  purpose: string;
  anchor: string;
  scriptRef?: string;
  imageProducer?: "image-factory";
  externalProducer?: "external-capability";
};

export type ChannelMediaReceipt = {
  receiptId: string;
  branchId: string;
  variantRef: string;
  contentRevisionId: string;
  artifactId: string;
  artifactKind: "binary-media" | "script";
  mediaType: string;
  sha256: string;
  bytes: number;
  producer: "image-factory" | "external-capability" | "content-factory";
};

type GeneratedImageBranch = {
  branchId: string;
  needId: string;
  kind: "generated-image";
  producer: "image-factory";
  status: "blocked" | "ready-for-approved-request" | "fulfilled";
  reason?: "image-factory-unavailable" | "image-factory-unknown";
  brief: VisualBrief;
  mediaBrief: ChannelMediaBrief;
  receipt: ChannelMediaReceipt | null;
};

type ExternalMediaBranch = {
  branchId: string;
  needId: string;
  kind: "external-video" | "external-audio";
  producer: "external-capability";
  status: "script-only" | "fulfilled";
  reason: "external-render-receipt-required";
  scriptRef: string;
  brief: ChannelMediaBrief;
  receipt: ChannelMediaReceipt | null;
};

export type ChannelMediaBranch = GeneratedImageBranch | ExternalMediaBranch;

export type ChannelMediaPlan = {
  variantRef: string;
  contentRevisionId: string;
  channelId: string;
  formatId: string;
  textStatus: "ready";
  branches: ChannelMediaBranch[];
};

function fail(code: string, message: string, details?: Record<string, unknown>): never {
  throw new ContentFactoryError({
    code,
    message,
    retryable: false,
    ...(details === undefined ? {} : { details })
  });
}

function requireScriptRef(need: ChannelMediaNeed): string {
  const scriptRef = need.scriptRef?.trim();
  if (!scriptRef) {
    fail(
      "MEDIA_SCRIPT_REF_REQUIRED",
      "external video and audio briefs require an approved script revision",
      { needId: need.needId }
    );
  }
  return scriptRef;
}

function externalBranch(input: {
  need: ChannelMediaNeed;
  variantRef: string;
  contentRevisionId: string;
  channelId: string;
  formatId: string;
}): ExternalMediaBranch {
  const scriptRef = requireScriptRef(input.need);
  const kind = input.need.kind === "video" ? "external-video" : "external-audio";
  const branchId = `media_${input.need.needId}`;
  return {
    branchId,
    needId: input.need.needId,
    kind,
    producer: "external-capability",
    status: "script-only",
    reason: "external-render-receipt-required",
    scriptRef,
    brief: {
      schemaVersion: 1,
      briefId: branchId,
      variantRef: input.variantRef,
      contentRevisionId: input.contentRevisionId,
      channelId: input.channelId,
      formatId: input.formatId,
      kind,
      purpose: input.need.purpose,
      anchor: input.need.anchor,
      scriptRef,
      externalProducer: "external-capability"
    },
    receipt: null
  };
}

function imageBranch(input: {
  need: ChannelMediaNeed;
  variantRef: string;
  contentRevisionId: string;
  channelId: string;
  formatId: string;
  imageFactoryStatus: ImageFactoryStatus;
}): GeneratedImageBranch {
  const { need } = input;
  const branchId = `media_${need.needId}`;
  const brief = createVisualBrief({
    briefId: branchId,
    revisionId: input.contentRevisionId,
    anchor: need.anchor,
    purpose: need.purpose,
    assetKind: need.kind,
    ...(need.aspectRatio === undefined ? {} : { aspectRatio: need.aspectRatio }),
    sourceRefs: need.sourceRefs ?? []
  });
  const mediaBrief: ChannelMediaBrief = {
    schemaVersion: 1,
    briefId: branchId,
    variantRef: input.variantRef,
    contentRevisionId: input.contentRevisionId,
    channelId: input.channelId,
    formatId: input.formatId,
    kind: "generated-image",
    purpose: need.purpose,
    anchor: need.anchor,
    imageProducer: "image-factory"
  };
  if (input.imageFactoryStatus === "available") {
    return {
      branchId,
      needId: need.needId,
      kind: "generated-image",
      producer: "image-factory",
      status: "ready-for-approved-request",
      brief,
      mediaBrief,
      receipt: null
    };
  }
  return {
    branchId,
    needId: need.needId,
    kind: "generated-image",
    producer: "image-factory",
    status: "blocked",
    reason: input.imageFactoryStatus === "unavailable"
      ? "image-factory-unavailable"
      : "image-factory-unknown",
    brief,
    mediaBrief,
    receipt: null
  };
}

export function createChannelMediaPlan(input: {
  variantRef: string;
  contentRevisionId: string;
  channelId: string;
  formatId: string;
  needs: ChannelMediaNeed[];
  imageFactoryStatus: ImageFactoryStatus;
}): ChannelMediaPlan {
  if (!input.variantRef.trim() || !input.contentRevisionId.trim()) {
    fail(
      "MEDIA_VARIANT_IDENTITY_REQUIRED",
      "channel media plans require variant and content revision identities"
    );
  }
  const needIds = new Set<string>();
  const branches = input.needs.map(need => {
    if (!need.needId.trim() || needIds.has(need.needId)) {
      fail(
        "MEDIA_NEED_ID_INVALID",
        "channel media need ids must be non-empty and unique",
        { needId: need.needId }
      );
    }
    needIds.add(need.needId);
    if (need.kind === "cover" || need.kind === "card") {
      return imageBranch({
        need,
        variantRef: input.variantRef,
        contentRevisionId: input.contentRevisionId,
        channelId: input.channelId,
        formatId: input.formatId,
        imageFactoryStatus: input.imageFactoryStatus
      });
    }
    return externalBranch({
      need,
      variantRef: input.variantRef,
      contentRevisionId: input.contentRevisionId,
      channelId: input.channelId,
      formatId: input.formatId
    });
  });

  return {
    variantRef: input.variantRef,
    contentRevisionId: input.contentRevisionId,
    channelId: input.channelId,
    formatId: input.formatId,
    textStatus: "ready",
    branches
  };
}

function validateReceipt(
  plan: ChannelMediaPlan,
  branch: ChannelMediaBranch,
  receipt: ChannelMediaReceipt
): void {
  if (
    receipt.variantRef !== plan.variantRef
    || receipt.contentRevisionId !== plan.contentRevisionId
  ) {
    fail(
      "MEDIA_RECEIPT_STALE_VARIANT",
      "media receipt belongs to another variant or content revision"
    );
  }
  if (receipt.branchId !== branch.branchId) {
    fail("MEDIA_RECEIPT_BRANCH_MISMATCH", "media receipt belongs to another branch");
  }
  if (receipt.artifactKind !== "binary-media") {
    fail(
      "MEDIA_RECEIPT_ARTIFACT_KIND_INVALID",
      "script or metadata artifacts cannot satisfy a binary media branch"
    );
  }
  const expectedProducer = branch.producer;
  const expectedPrefix = branch.kind === "generated-image"
    ? "image/"
    : branch.kind === "external-video"
      ? "video/"
      : "audio/";
  if (receipt.producer !== expectedProducer || !receipt.mediaType.startsWith(expectedPrefix)) {
    fail(
      "MEDIA_RECEIPT_CONTRACT_MISMATCH",
      "media receipt producer or media type does not satisfy the branch contract"
    );
  }
  if (!/^[0-9a-f]{64}$/u.test(receipt.sha256) || receipt.bytes <= 0) {
    fail("MEDIA_RECEIPT_INTEGRITY_INVALID", "media receipt integrity fields are invalid");
  }
}

function copyBranch(branch: ChannelMediaBranch): ChannelMediaBranch {
  if (branch.kind === "generated-image") {
    return {
      ...branch,
      brief: {
        ...branch.brief,
        textConstraints: [...branch.brief.textConstraints],
        sourceRefs: [...branch.brief.sourceRefs]
      },
      mediaBrief: { ...branch.mediaBrief },
      receipt: branch.receipt === null ? null : { ...branch.receipt }
    };
  }
  return {
    ...branch,
    brief: { ...branch.brief },
    receipt: branch.receipt === null ? null : { ...branch.receipt }
  };
}

export function bindChannelMediaReceipt(
  plan: ChannelMediaPlan,
  receipt: ChannelMediaReceipt
): ChannelMediaPlan {
  const branch = plan.branches.find(item => item.branchId === receipt.branchId);
  if (branch === undefined) {
    fail("MEDIA_RECEIPT_BRANCH_NOT_FOUND", "media receipt references an unknown branch");
  }
  validateReceipt(plan, branch, receipt);

  return {
    ...plan,
    branches: plan.branches.map(item => {
      const copied = copyBranch(item);
      if (copied.branchId !== receipt.branchId) return copied;
      return {
        ...copied,
        status: "fulfilled",
        receipt: { ...receipt }
      } as ChannelMediaBranch;
    })
  };
}

export function summarizeChannelMediaPlan(plan: ChannelMediaPlan): {
  textStatus: "ready";
  packageKind: "text-only" | "text-with-media-pending" | "script-package" | "media-package";
  completedMediaArtifacts: number;
  pendingBranches: string[];
  published: false;
} {
  const completedMediaArtifacts = plan.branches
    .filter(branch => branch.status === "fulfilled").length;
  const pendingBranches = plan.branches
    .filter(branch => branch.status !== "fulfilled")
    .map(branch => branch.branchId);
  const hasExternalBranches = plan.branches.some(branch =>
    branch.kind === "external-video" || branch.kind === "external-audio"
  );
  const packageKind = completedMediaArtifacts > 0
    ? "media-package"
    : hasExternalBranches
      ? "script-package"
      : pendingBranches.length > 0
        ? "text-with-media-pending"
        : "text-only";

  return {
    textStatus: "ready",
    packageKind,
    completedMediaArtifacts,
    pendingBranches,
    published: false
  };
}
