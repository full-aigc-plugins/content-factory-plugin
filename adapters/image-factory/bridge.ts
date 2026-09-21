import { createHash } from "node:crypto";

import type { VisualBrief } from "../../packages/core/src/content/assets.ts";
import { ContentFactoryError } from "../../packages/core/src/errors.ts";
import {
  bindChannelMediaReceipt,
  type ChannelMediaPlan
} from "../../packages/core/src/channels/assets.ts";
import {
  authorizeGeneration,
  type GenerationApproval,
  type GenerationCapability
} from "../../packages/core/src/security/generation-approval.ts";

export type GenerationReceipt = {
  requestId: string;
  variantRef: string;
  artifactId: string;
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  modelReported: string | null;
};

export type GenerationResponse = {
  receipt: GenerationReceipt;
  bytes: Buffer;
};

export type ImageFactoryPort = {
  submit(input: {
    requestId: string;
    brief: VisualBrief;
    budgetRef: string;
  }): Promise<GenerationResponse>;
  reconcile(requestId: string): Promise<GenerationResponse | null>;
};

export type ImageFactoryResult =
  | {
    status: "succeeded";
    asset: GenerationReceipt;
    reconciled: boolean;
    retry: "never";
  }
  | {
    status: "blocked" | "failed" | "unknown";
    reason: string;
    retry: "never" | "reconcile_first";
  };

function validReceipt(
  response: GenerationResponse,
  requestId: string,
  revisionId: string
): boolean {
  const { receipt, bytes } = response;
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  return receipt.requestId === requestId
    && receipt.variantRef === revisionId
    && receipt.sha256 === actualHash
    && receipt.bytes === bytes.length
    && receipt.bytes > 0
    && receipt.width > 0
    && receipt.height > 0;
}

function accepted(response: GenerationResponse, reconciled: boolean): ImageFactoryResult {
  return {
    status: "succeeded",
    asset: { ...response.receipt },
    reconciled,
    retry: "never"
  };
}

function outcomeUnknown(error: unknown): boolean {
  return error instanceof Error
    && "outcomeUnknown" in error
    && error.outcomeUnknown === true;
}

export async function invokeImageFactory(input: {
  requestId: string;
  brief: VisualBrief;
  capability: GenerationCapability;
  approval: GenerationApproval;
  port: ImageFactoryPort;
}): Promise<ImageFactoryResult> {
  const authorization = authorizeGeneration(input.capability, input.approval);
  if (!authorization.allowed) {
    return { status: "blocked", reason: authorization.reason, retry: "never" };
  }

  try {
    const response = await input.port.submit({
      requestId: input.requestId,
      brief: input.brief,
      budgetRef: authorization.budgetRef
    });
    if (!validReceipt(response, input.requestId, input.brief.revisionId)) {
      return { status: "failed", reason: "invalid-generation-receipt", retry: "never" };
    }
    return accepted(response, false);
  } catch (error) {
    if (!outcomeUnknown(error)) {
      return { status: "failed", reason: "image-generation-failed", retry: "never" };
    }
    const reconciled = await input.port.reconcile(input.requestId);
    if (reconciled === null) {
      return {
        status: "unknown",
        reason: "generation-outcome-unknown",
        retry: "reconcile_first"
      };
    }
    if (!validReceipt(reconciled, input.requestId, input.brief.revisionId)) {
      return { status: "failed", reason: "invalid-generation-receipt", retry: "never" };
    }
    return accepted(reconciled, true);
  }
}

function imageMediaType(path: string): string | null {
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (normalized.endsWith(".webp")) return "image/webp";
  return null;
}

export function bindImageFactoryResultToChannelPlan(
  plan: ChannelMediaPlan,
  branchId: string,
  result: ImageFactoryResult
): ChannelMediaPlan {
  if (result.status !== "succeeded") {
    throw new ContentFactoryError({
      code: "IMAGE_FACTORY_RESULT_NOT_SUCCEEDED",
      message: "only a verified successful Image Factory result can fulfill a media branch",
      retryable: false,
      details: { status: result.status }
    });
  }
  const mediaType = imageMediaType(result.asset.path);
  if (mediaType === null) {
    throw new ContentFactoryError({
      code: "IMAGE_FACTORY_MEDIA_TYPE_UNSUPPORTED",
      message: "Image Factory receipt path does not identify a supported image media type",
      retryable: false,
      details: { path: result.asset.path }
    });
  }
  return bindChannelMediaReceipt(plan, {
    receiptId: `image_factory_${result.asset.requestId}`,
    branchId,
    variantRef: plan.variantRef,
    contentRevisionId: result.asset.variantRef,
    artifactId: result.asset.artifactId,
    artifactKind: "binary-media",
    mediaType,
    sha256: result.asset.sha256,
    bytes: result.asset.bytes,
    producer: "image-factory"
  });
}
