import { getDocument, PasswordResponses } from "pdfjs-dist/legacy/build/pdf.mjs";

import { ContentFactoryError } from "../errors.ts";
import type { WorkspaceStore } from "../workspace/store.ts";
import {
  assertDocumentSize,
  registerExtractedDocument,
  type DocumentSourceBase
} from "./document-common.ts";

const PDF_MEDIA_TYPE = "application/pdf";

export type PdfPageText = {
  page: number;
  text: string;
};

export type PdfImportInput = {
  fileName: string;
  bytes: Uint8Array;
  maxBytes?: number;
  maxPages?: number;
};

export type PdfSourceRecord = DocumentSourceBase & {
  mediaType: typeof PDF_MEDIA_TYPE;
  pages: PdfPageText[];
};

function documentError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ContentFactoryError {
  return new ContentFactoryError({ code, message, retryable: false, details });
}

export async function importPdfSource(
  store: WorkspaceStore,
  input: PdfImportInput
): Promise<PdfSourceRecord> {
  if (!input.fileName.trim()) {
    throw documentError("SOURCE_NAME_REQUIRED", "PDF source requires a file name");
  }
  assertDocumentSize(input.bytes, input.maxBytes);
  const maxPages = input.maxPages ?? 1000;
  if (!Number.isInteger(maxPages) || maxPages <= 0) {
    throw documentError("DOCUMENT_PAGE_LIMIT_INVALID", "PDF page budget must be a positive integer");
  }

  let pdf: Awaited<ReturnType<typeof getDocument>["promise"]> | undefined;
  try {
    const task = getDocument({
      data: new Uint8Array(input.bytes),
      isEvalSupported: false,
      useSystemFonts: false,
      stopEventPropagation: true
    });
    pdf = await task.promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      throw documentError("DOCUMENT_ENCRYPTED_UNSUPPORTED", "encrypted PDF is not supported");
    }
    throw documentError("DOCUMENT_PARSE_FAILED", "PDF could not be parsed", {
      cause: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    if (pdf.numPages > maxPages) {
      throw documentError("DOCUMENT_PAGE_LIMIT", "PDF exceeds the configured page budget", {
        actualPages: pdf.numPages,
        maxPages
      });
    }

    const pages: PdfPageText[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push({ page: pageNumber, text });
      page.cleanup();
    }

    const text = pages
      .filter(page => page.text.length > 0)
      .map(page => `[Page ${page.page}]\n${page.text}`)
      .join("\n\n")
      .trim();

    if (!text) {
      throw documentError(
        "DOCUMENT_TEXT_UNAVAILABLE",
        "PDF has no extractable text layer; OCR is not enabled in CF-010",
        { ocrAttempted: false, pages: pdf.numPages }
      );
    }

    const record = await registerExtractedDocument(store, {
      fileName: input.fileName,
      mediaType: PDF_MEDIA_TYPE,
      bytes: input.bytes,
      text,
      warnings: []
    });
    return { ...record, mediaType: PDF_MEDIA_TYPE, pages };
  } finally {
    await pdf.destroy();
  }
}
