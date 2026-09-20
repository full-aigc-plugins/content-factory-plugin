export const IMAGE_FACTORY_CONTRACT_VERSION = "1.0.0" as const;
export const IMAGE_FACTORY_RECEIPT_SCHEMA_ID =
  "https://github.com/full-aigc-plugins/image-factory-plugin/schemas/artifact_receipt.schema.json" as const;

export type ImageFactoryCapabilityStatus = "available" | "unavailable" | "unknown";

export type ImageFactoryProbeInput = {
  advertised: boolean | null;
  contractVersion?: string | null;
  receiptSchemaId?: string | null;
};

export type ImageFactoryProbeReport = {
  status: ImageFactoryCapabilityStatus;
  contractVersion: string | null;
  receiptSchemaId: string | null;
  reasons: string[];
  externalCalls: 0;
};

export type ImageFactoryReceiptValidation = {
  ok: boolean;
  errors: string[];
};

const SHA256 = /^[0-9a-f]{64}$/;
const IDENTIFIER = /^[a-z0-9][a-z0-9_-]{0,127}$/;

export function probeImageFactory(input: ImageFactoryProbeInput): ImageFactoryProbeReport {
  if (input.advertised === null) {
    return {
      status: "unknown",
      contractVersion: null,
      receiptSchemaId: null,
      reasons: ["capability_not_probed"],
      externalCalls: 0
    };
  }
  if (!input.advertised) {
    return {
      status: "unavailable",
      contractVersion: null,
      receiptSchemaId: null,
      reasons: ["image_factory_not_advertised"],
      externalCalls: 0
    };
  }

  const reasons: string[] = [];
  if (input.contractVersion !== IMAGE_FACTORY_CONTRACT_VERSION) {
    reasons.push("unsupported_contract_version");
  }
  if (input.receiptSchemaId !== IMAGE_FACTORY_RECEIPT_SCHEMA_ID) {
    reasons.push("unexpected_receipt_schema");
  }

  return {
    status: reasons.length === 0 ? "available" : "unavailable",
    contractVersion: input.contractVersion ?? null,
    receiptSchemaId: input.receiptSchemaId ?? null,
    reasons,
    externalCalls: 0
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function positiveInteger(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) > 0;
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

export function validateImageFactoryReceipt(value: unknown): ImageFactoryReceiptValidation {
  const receipt = record(value);
  if (!receipt) return { ok: false, errors: ["receipt"] };

  const errors: string[] = [];
  const requiredStrings = ["path", "collected_at"] as const;
  for (const name of requiredStrings) {
    if (!nonEmptyString(receipt[name])) errors.push(name);
  }

  if (receipt.schema_version !== IMAGE_FACTORY_CONTRACT_VERSION) errors.push("schema_version");
  if (receipt.plugin_id !== "image-factory") errors.push("plugin_id");

  for (const name of ["batch_id", "item_id", "artifact_id"] as const) {
    const valueAtField = receipt[name];
    if (!nonEmptyString(valueAtField) || !IDENTIFIER.test(valueAtField as string)) errors.push(name);
  }

  for (const name of ["sha256", "prompt_sha256", "idempotency_key"] as const) {
    const valueAtField = receipt[name];
    if (typeof valueAtField !== "string" || !SHA256.test(valueAtField)) errors.push(name);
  }

  for (const name of ["round", "bytes", "width", "height"] as const) {
    if (!positiveInteger(receipt[name])) errors.push(name);
  }

  const source = record(receipt.source);
  if (!source) {
    errors.push("source");
  } else {
    if (source.kind !== "codex_image_gen") errors.push("source.kind");
    if (!nonEmptyString(source.session_id)) errors.push("source.session_id");
    if (!nonEmptyString(source.call_id)) errors.push("source.call_id");
    if (source.model_reported !== undefined
        && source.model_reported !== null
        && typeof source.model_reported !== "string") {
      errors.push("source.model_reported");
    }
  }

  if (typeof receipt.collected_at === "string"
      && Number.isNaN(Date.parse(receipt.collected_at))) {
    errors.push("collected_at");
  }

  return { ok: errors.length === 0, errors };
}
