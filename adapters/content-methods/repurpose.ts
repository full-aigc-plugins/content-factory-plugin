import { createHash } from "node:crypto";

import { ContentFactoryError } from "../../packages/core/src/errors.ts";
import {
  supportedNumbers,
  type RepurposeRequest
} from "../../packages/core/src/content/repurpose.ts";

export type RepurposedRevision = {
  kind: "repurposed";
  contentItemId: string;
  parentContentItemId: string;
  text: string;
  vendorMethod: string;
  status: "review-required";
  detectionStatus: "required";
  approvalStatus: "required";
  fingerprint: string;
  mediaHandoff: {
    kind: "video-script";
    status: "script-only";
    contentItemId: string;
  } | null;
};

export function acceptRepurposedCandidate(
  request: RepurposeRequest,
  candidate: {
    text: string;
    vendorMethod: string;
  }
): RepurposedRevision {
  const text = candidate.text.trim();
  const allowedNumbers = supportedNumbers(request);

  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/gu)) {
    if (!allowedNumbers.has(match[0])) {
      throw new ContentFactoryError({
        code: "REPURPOSE_UNSUPPORTED_NUMBER",
        message: "repurposed content introduces a number not supported by the parent or claims",
        retryable: false,
        details: { value: match[0] }
      });
    }
  }

  const vendorMethod = candidate.vendorMethod.trim();
  if (!vendorMethod) {
    throw new ContentFactoryError({
      code: "REPURPOSE_VENDOR_REQUIRED",
      message: "repurpose vendor method identity is required",
      retryable: false
    });
  }

  const mediaHandoff = request.target.format === "video-script"
    ? {
        kind: "video-script" as const,
        status: "script-only" as const,
        contentItemId: request.child.contentItemId
      }
    : null;

  return {
    kind: "repurposed",
    contentItemId: request.child.contentItemId,
    parentContentItemId: request.parent.contentItemId,
    text,
    vendorMethod,
    status: "review-required",
    detectionStatus: "required",
    approvalStatus: "required",
    fingerprint: createHash("sha256").update(JSON.stringify({
      child: request.child,
      text,
      vendorMethod
    })).digest("hex"),
    mediaHandoff
  };
}
