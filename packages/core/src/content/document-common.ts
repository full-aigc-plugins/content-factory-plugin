import { createHash } from "node:crypto";

import type { WorkspaceStore } from "../workspace/store.ts";

export const DEFAULT_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

export type DocumentWarning =
  | "TABLE_LINEARIZED"
  | "FORMULA_LINEARIZED"
  | "LAYOUT_NOT_PRESERVED";

export type DocumentSourceBase = {
  sourceId: string;
  fileName: string;
  mediaType: string;
  rawSha256: string;
  textSha256: string;
  bytes: number;
  text: string;
  importedAt: string;
  warnings: DocumentWarning[];
};

export function assertDocumentSize(
  bytes: Uint8Array,
  maxBytes = DEFAULT_DOCUMENT_MAX_BYTES
): void {
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("document maxBytes must be a positive integer");
  }
  if (bytes.byteLength > maxBytes) {
    const error = new Error("document exceeds the explicit byte budget") as Error & {
      code?: string;
      details?: Record<string, unknown>;
    };
    error.code = "DOCUMENT_TOO_LARGE";
    error.details = { actualBytes: bytes.byteLength, maxBytes };
    throw error;
  }
}

export async function registerExtractedDocument(
  store: WorkspaceStore,
  input: {
    fileName: string;
    mediaType: string;
    bytes: Uint8Array;
    text: string;
    warnings: DocumentWarning[];
  }
): Promise<DocumentSourceBase> {
  const object = await store.putObject(input.bytes);
  const textSha256 = createHash("sha256").update(Buffer.from(input.text, "utf8")).digest("hex");
  const importedAt = new Date().toISOString();
  const sourceId = "src_" + object.sha256.slice(0, 24);
  const persisted = store.registerSource({
    sourceId,
    fileName: input.fileName,
    mediaType: input.mediaType,
    rawSha256: object.sha256,
    textSha256,
    bytes: input.bytes.byteLength,
    importedAt
  });
  return {
    sourceId: persisted.sourceId,
    fileName: persisted.fileName,
    mediaType: persisted.mediaType,
    rawSha256: persisted.rawSha256,
    textSha256: persisted.textSha256,
    bytes: persisted.bytes,
    text: input.text,
    importedAt: persisted.importedAt,
    warnings: input.warnings
  };
}
