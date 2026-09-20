import { createHash } from "node:crypto";
import path from "node:path";

import { ContentFactoryError } from "../errors.ts";
import type { WorkspaceStore } from "../workspace/store.ts";

export type TextSourceInput = {
  fileName: string;
  bytes: Uint8Array;
  mediaType?: "text/plain" | "text/markdown";
  maxBytes?: number;
};

export type TextSourceRecord = {
  sourceId: string;
  fileName: string;
  mediaType: "text/plain" | "text/markdown";
  rawSha256: string;
  textSha256: string;
  bytes: number;
  text: string;
  importedAt: string;
};

function inferMediaType(fileName: string): "text/plain" | "text/markdown" {
  const extension = path.extname(fileName).toLowerCase();
  return extension === ".md" || extension === ".markdown" ? "text/markdown" : "text/plain";
}

function sourceId(rawSha256: string): string {
  return "src_" + rawSha256.slice(0, 24);
}

export async function importTextSource(
  store: WorkspaceStore,
  input: TextSourceInput
): Promise<TextSourceRecord> {
  if (!input.fileName.trim()) {
    throw new ContentFactoryError({
      code: "SOURCE_NAME_REQUIRED",
      message: "text source requires a file name",
      retryable: false
    });
  }

  const actualBytes = input.bytes.byteLength;
  if (actualBytes === 0) {
    throw new ContentFactoryError({
      code: "SOURCE_EMPTY",
      message: "text source is empty",
      retryable: false
    });
  }
  if (input.maxBytes !== undefined && actualBytes > input.maxBytes) {
    throw new ContentFactoryError({
      code: "SOURCE_TOO_LARGE",
      message: "text source exceeds the explicit byte budget",
      retryable: false,
      details: { actualBytes, maxBytes: input.maxBytes }
    });
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
  } catch {
    throw new ContentFactoryError({
      code: "SOURCE_ENCODING_UNSUPPORTED",
      message: "text source must be valid UTF-8",
      retryable: false
    });
  }

  const object = await store.putObject(input.bytes);
  const textSha256 = createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
  const importedAt = new Date().toISOString();
  const persisted = store.registerSource({
    sourceId: sourceId(object.sha256),
    fileName: input.fileName,
    mediaType: input.mediaType ?? inferMediaType(input.fileName),
    rawSha256: object.sha256,
    textSha256,
    bytes: actualBytes,
    importedAt
  });

  return {
    ...persisted,
    mediaType: persisted.mediaType as "text/plain" | "text/markdown",
    text
  };
}
