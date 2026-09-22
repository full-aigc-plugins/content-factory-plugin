import { createHash } from "node:crypto";

import type { AiContentDetectorClient } from "../../../../adapters/zhuque/client.ts";
import type {
  DetectionEvidenceStore,
  RawDetectionResponse
} from "./store.ts";

export type DetectorRequest = {
  requestId: string;
  text: string;
  textHash: string;
  canonicalizationVersion: string;
  credentialRef: string;
  transmissionApproved: boolean;
};

export type DetectionInterpretation =
  | {
    status: "succeeded";
    providerRequestId: string;
  }
  | {
    status: "business-failure";
    reason: string;
  };

export type DetectionContract = (
  rawBody: Uint8Array
) => DetectionInterpretation;

export type DetectionJob = {
  requestId: string;
  status: "blocked" | "failed" | "unknown" | "succeeded";
  reason: string | null;
  textHash: string;
  canonicalizationVersion: string;
  providerRequestId: string | null;
  rawResponse: RawDetectionResponse | null;
  completedAt: string;
};

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function job(
  request: DetectorRequest,
  input: {
    status: DetectionJob["status"];
    reason: string | null;
    providerRequestId?: string | null;
    rawResponse?: RawDetectionResponse | null;
  },
  now: () => string
): DetectionJob {
  return {
    requestId: request.requestId,
    status: input.status,
    reason: input.reason,
    textHash: request.textHash,
    canonicalizationVersion: request.canonicalizationVersion,
    providerRequestId: input.providerRequestId ?? null,
    rawResponse: input.rawResponse ?? null,
    completedAt: now()
  };
}

export async function runDetection(input: {
  request: DetectorRequest;
  client: AiContentDetectorClient;
  store: DetectionEvidenceStore;
  contract: DetectionContract;
  now?: () => string;
}): Promise<DetectionJob> {
  const now = input.now ?? (() => new Date().toISOString());
  const { request } = input;
  if (!request.transmissionApproved) {
    return job(request, {
      status: "blocked",
      reason: "external-transmission-not-approved"
    }, now);
  }

  const textBytes = Buffer.from(request.text, "utf8");
  if (sha256(textBytes) !== request.textHash) {
    return job(request, {
      status: "blocked",
      reason: "text-hash-mismatch"
    }, now);
  }

  let exchange;
  try {
    exchange = await input.client.submit({
      requestId: request.requestId,
      textBytes,
      credentialRef: request.credentialRef
    });
  } catch {
    return job(request, {
      status: "unknown",
      reason: "provider-transport-error"
    }, now);
  }

  if (exchange.status === "blocked") {
    return job(request, {
      status: "blocked",
      reason: exchange.reason
    }, now);
  }

  const rawResponse = await input.store.putRaw(exchange.rawBody);
  if (exchange.httpStatus < 200 || exchange.httpStatus >= 300) {
    return job(request, {
      status: "failed",
      reason: "provider-http-failure",
      rawResponse
    }, now);
  }

  let interpretation: DetectionInterpretation;
  try {
    interpretation = input.contract(exchange.rawBody);
  } catch {
    return job(request, {
      status: "unknown",
      reason: "provider-contract-error",
      rawResponse
    }, now);
  }

  if (interpretation.status === "business-failure") {
    return job(request, {
      status: "failed",
      reason: "provider-business-failure",
      rawResponse
    }, now);
  }

  return job(request, {
    status: "succeeded",
    reason: null,
    providerRequestId: interpretation.providerRequestId,
    rawResponse
  }, now);
}
