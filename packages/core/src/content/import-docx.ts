import { strFromU8, unzipSync } from "fflate";

import { ContentFactoryError } from "../errors.ts";
import type { WorkspaceStore } from "../workspace/store.ts";
import {
  assertDocumentSize,
  registerExtractedDocument,
  type DocumentSourceBase,
  type DocumentWarning
} from "./document-common.ts";

const DOCX_MEDIA_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DEFAULT_MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;

export type DocxImportInput = {
  fileName: string;
  bytes: Uint8Array;
  maxBytes?: number;
  maxUncompressedBytes?: number;
};

export type DocxSourceRecord = DocumentSourceBase & {
  mediaType: typeof DOCX_MEDIA_TYPE;
};

function documentError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ContentFactoryError {
  return new ContentFactoryError({ code, message, retryable: false, details });
}

function estimateZipUncompressedBytes(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  const start = Math.max(0, bytes.byteLength - 65557);
  for (let offset = bytes.byteLength - 22; offset >= start; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX ZIP end record is missing");

  const entries = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (entries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw documentError("DOCUMENT_ARCHIVE_UNSUPPORTED", "ZIP64 DOCX archives are not supported");
  }
  if (centralOffset + centralSize > bytes.byteLength) {
    throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX central directory is outside the archive");
  }

  let offset = centralOffset;
  let total = 0;
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX central directory is malformed");
    }
    const uncompressed = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (uncompressed === 0xffffffff) {
      throw documentError("DOCUMENT_ARCHIVE_UNSUPPORTED", "ZIP64 DOCX entries are not supported");
    }
    total += uncompressed;
    if (!Number.isSafeInteger(total)) {
      throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX expanded size is invalid");
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return total;
}

function decodeXml(text: string): string {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'"
  };
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (whole, token: string) => {
    const lower = token.toLowerCase();
    if (lower.startsWith("#x")) {
      const value = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
    }
    if (lower.startsWith("#")) {
      const value = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
    }
    return named[lower] ?? whole;
  });
}

function extractDocxText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<w:tab\b[^>]*\/>/gi, "\t")
      .replace(/<w:(br|cr)\b[^>]*\/>/gi, "\n")
      .replace(/<\/w:(p|tr)>/gi, "\n")
      .replace(/<\/w:tc>/gi, "\t")
      .replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi, "$1")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasExternalRelationship(files: Record<string, Uint8Array>): boolean {
  return Object.entries(files)
    .filter(([name]) => name.endsWith(".rels"))
    .some(([, content]) => /TargetMode\s*=\s*["']External["']/i.test(strFromU8(content)));
}

export async function importDocxSource(
  store: WorkspaceStore,
  input: DocxImportInput
): Promise<DocxSourceRecord> {
  if (!input.fileName.trim()) {
    throw documentError("SOURCE_NAME_REQUIRED", "DOCX source requires a file name");
  }
  assertDocumentSize(input.bytes, input.maxBytes);
  const maxUncompressedBytes = input.maxUncompressedBytes ?? DEFAULT_MAX_UNCOMPRESSED_BYTES;
  if (!Number.isInteger(maxUncompressedBytes) || maxUncompressedBytes <= 0) {
    throw documentError("DOCUMENT_UNCOMPRESSED_LIMIT_INVALID", "DOCX expanded-byte budget is invalid");
  }

  let estimated: number;
  try {
    estimated = estimateZipUncompressedBytes(input.bytes);
  } catch (error) {
    if (error instanceof ContentFactoryError) throw error;
    throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX archive could not be inspected");
  }
  if (estimated > maxUncompressedBytes) {
    throw documentError(
      "DOCUMENT_UNCOMPRESSED_LIMIT",
      "DOCX expanded content exceeds the configured budget",
      { actualBytes: estimated, maxUncompressedBytes }
    );
  }

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(input.bytes);
  } catch {
    throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX archive could not be decompressed");
  }
  if (hasExternalRelationship(files)) {
    throw documentError(
      "DOCUMENT_EXTERNAL_RELATIONSHIP_UNSUPPORTED",
      "DOCX contains an external relationship; network resolution is disabled"
    );
  }

  const document = files["word/document.xml"];
  if (!document) {
    throw documentError("DOCUMENT_ARCHIVE_INVALID", "DOCX is missing word/document.xml");
  }
  const xml = strFromU8(document);
  const text = extractDocxText(xml);
  if (!text) {
    throw documentError("DOCUMENT_TEXT_UNAVAILABLE", "DOCX contains no extractable text", {
      ocrAttempted: false
    });
  }

  const warnings: DocumentWarning[] = [];
  if (/<w:tbl\b/i.test(xml)) warnings.push("TABLE_LINEARIZED");
  if (/<m:oMath\b/i.test(xml)) warnings.push("FORMULA_LINEARIZED");
  if (warnings.length > 0) warnings.push("LAYOUT_NOT_PRESERVED");

  const record = await registerExtractedDocument(store, {
    fileName: input.fileName,
    mediaType: DOCX_MEDIA_TYPE,
    bytes: input.bytes,
    text,
    warnings
  });
  return { ...record, mediaType: DOCX_MEDIA_TYPE };
}
