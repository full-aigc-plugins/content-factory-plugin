export interface VisualBrief {
  contentId: string;
  revisionId: string;
  anchor: string;
  purpose: string;
  assetKind: string;
  aspectRatio?: string;
  prompt: string;
  sourceRefs: string[];
  textConstraints: string[];
  budgetRef?: string;
}

export interface CreateVisualBriefInput {
  contentId: string;
  revisionId: string;
  anchor: string;
  purpose: string;
  assetKind: string;
  aspectRatio?: string;
  prompt: string;
  sourceRefs?: string[];
  textConstraints?: string[];
  budgetRef?: string;
}

export interface ImageFactoryProbeResult {
  available: boolean;
  evidence: unknown;
}

export interface ImageFactoryReceipt {
  receiptId?: string;
  artifactPath?: string;
  artifactSha256?: string;
  backend?: string;
  [key: string]: unknown;
}

export interface ImageFactoryRunResult {
  receipt?: ImageFactoryReceipt;
  raw?: unknown;
}

export interface ImageFactoryClient {
  probe(): Promise<ImageFactoryProbeResult>;
  run(brief: VisualBrief): Promise<ImageFactoryRunResult>;
}

export type ImageFactoryInvocationStatus =
  | "approval_required"
  | "unavailable"
  | "failed"
  | "invalid_receipt"
  | "succeeded";

export interface ImageFactoryInvocationResult {
  status: ImageFactoryInvocationStatus;
  brief: VisualBrief;
  probeEvidence?: unknown;
  receipt?: ImageFactoryReceipt;
  raw?: unknown;
  error?: string;
}

const SHA256_RE = /^[0-9a-f]{64}$/i;

export function createVisualBrief(input: CreateVisualBriefInput): VisualBrief {
  return {
    contentId: input.contentId,
    revisionId: input.revisionId,
    anchor: input.anchor,
    purpose: input.purpose,
    assetKind: input.assetKind,
    aspectRatio: input.aspectRatio,
    prompt: input.prompt,
    sourceRefs: [...(input.sourceRefs ?? [])],
    textConstraints: [...(input.textConstraints ?? [])],
    budgetRef: input.budgetRef
  };
}

function validateReceipt(receipt: ImageFactoryReceipt | undefined): string | undefined {
  if (!receipt) return "Image Factory did not return a receipt";
  if (!receipt.receiptId || typeof receipt.receiptId !== "string") {
    return "Image Factory receipt is missing receiptId";
  }
  if (!receipt.artifactPath || typeof receipt.artifactPath !== "string") {
    return "Image Factory receipt is missing artifactPath";
  }
  if (!receipt.artifactSha256 || typeof receipt.artifactSha256 !== "string" || !SHA256_RE.test(receipt.artifactSha256)) {
    return "Image Factory receipt is missing a valid artifact sha256";
  }
  return undefined;
}

export async function invokeImageFactory(options: {
  brief: VisualBrief;
  approved: boolean;
  client: ImageFactoryClient;
}): Promise<ImageFactoryInvocationResult> {
  if (!options.approved) {
    return {
      status: "approval_required",
      brief: options.brief,
      error: "Image generation requires explicit approval"
    };
  }

  let probe: ImageFactoryProbeResult;
  try {
    probe = await options.client.probe();
  } catch (error) {
    return {
      status: "unavailable",
      brief: options.brief,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  if (!probe.available) {
    return {
      status: "unavailable",
      brief: options.brief,
      probeEvidence: probe.evidence,
      error: "Image Factory is unavailable"
    };
  }

  let run: ImageFactoryRunResult;
  try {
    run = await options.client.run(options.brief);
  } catch (error) {
    return {
      status: "failed",
      brief: options.brief,
      probeEvidence: probe.evidence,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  const receiptError = validateReceipt(run.receipt);
  if (receiptError) {
    return {
      status: "invalid_receipt",
      brief: options.brief,
      probeEvidence: probe.evidence,
      receipt: run.receipt,
      raw: run.raw,
      error: receiptError
    };
  }

  return {
    status: "succeeded",
    brief: options.brief,
    probeEvidence: probe.evidence,
    receipt: run.receipt,
    raw: run.raw
  };
}
