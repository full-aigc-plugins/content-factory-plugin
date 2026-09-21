import { ContentFactoryError } from "../errors.ts";
import {
  assertPublicHttpUrl,
  type ResolveHost
} from "../security/url-policy.ts";

export type SourceTransport = (
  url: URL,
  init: RequestInit
) => Promise<Response>;

export type FetchWebSourceInput = {
  url: string;
  maxBytes?: number;
  maxRedirects?: number;
  transport?: SourceTransport;
  resolveHost?: ResolveHost;
};

export type FetchedWebSource = {
  requestedUrl: string;
  finalUrl: string;
  fetchedAt: string;
  accessStatus: "read";
  contentType: string;
  bytes: number;
  text: string;
  trust: "untrusted";
  instructionPolicy: "data-only";
  locator: {
    kind: "url";
    url: string;
  };
  redirects: number;
};

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;

const defaultTransport: SourceTransport = (url, init) => fetch(url, init);

function contentTypeOf(response: Response): string {
  return (response.headers.get("content-type") ?? "text/plain")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
}

function supportedTextContentType(contentType: string): boolean {
  return contentType.startsWith("text/")
    || contentType === "application/json"
    || contentType === "application/xml"
    || contentType === "application/xhtml+xml";
}

async function readBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ContentFactoryError({
      code: "SOURCE_TOO_LARGE",
      message: "remote source exceeds the explicit byte budget",
      retryable: false,
      details: { actualBytes: declared, maxBytes }
    });
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ContentFactoryError({
        code: "SOURCE_TOO_LARGE",
        message: "remote source exceeds the explicit byte budget",
        retryable: false,
        details: { actualBytes: total, maxBytes }
      });
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };
  return text.replace(
    /&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,
    (whole, token: string) => {
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
    }
  );
}

function htmlToReadableText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|section|article|main|header|footer|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ContentFactoryError({
      code: "SOURCE_ENCODING_UNSUPPORTED",
      message: "remote textual source must be valid UTF-8",
      retryable: false
    });
  }
}

export async function fetchWebSource(input: FetchWebSourceInput): Promise<FetchedWebSource> {
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = input.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new ContentFactoryError({
      code: "SOURCE_BYTE_BUDGET_INVALID",
      message: "source byte budget must be a positive integer",
      retryable: false
    });
  }
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0) {
    throw new ContentFactoryError({
      code: "SOURCE_REDIRECT_LIMIT_INVALID",
      message: "redirect limit must be a non-negative integer",
      retryable: false
    });
  }

  const transport = input.transport ?? defaultTransport;
  let current = await assertPublicHttpUrl(input.url, { resolveHost: input.resolveHost });
  let redirects = 0;

  while (true) {
    let response: Response;
    try {
      response = await transport(current, {
        method: "GET",
        redirect: "manual",
        headers: {
          accept: "text/html,text/plain,text/markdown,application/xhtml+xml,application/json;q=0.8"
        }
      });
    } catch (error) {
      if (error instanceof ContentFactoryError) throw error;
      throw new ContentFactoryError({
        code: "SOURCE_NETWORK_FAILED",
        message: "source request failed",
        retryable: true,
        details: { url: current.href, cause: error instanceof Error ? error.message : String(error) }
      });
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ContentFactoryError({
          code: "SOURCE_REDIRECT_INVALID",
          message: "source redirect is missing a location",
          retryable: false,
          details: { status: response.status, url: current.href }
        });
      }
      if (redirects >= maxRedirects) {
        throw new ContentFactoryError({
          code: "SOURCE_REDIRECT_LIMIT",
          message: "source exceeded the redirect limit",
          retryable: false,
          details: { maxRedirects }
        });
      }
      const next = new URL(location, current);
      current = await assertPublicHttpUrl(next, { resolveHost: input.resolveHost });
      redirects += 1;
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new ContentFactoryError({
        code: "SOURCE_ACCESS_RESTRICTED",
        message: "source requires authorization or denies access",
        retryable: false,
        details: { status: response.status, url: current.href }
      });
    }
    if (!response.ok) {
      throw new ContentFactoryError({
        code: "SOURCE_HTTP_ERROR",
        message: "source returned an unsuccessful HTTP status",
        retryable: response.status >= 500 || response.status === 429,
        details: { status: response.status, url: current.href }
      });
    }

    const contentType = contentTypeOf(response);
    if (!supportedTextContentType(contentType)) {
      throw new ContentFactoryError({
        code: "SOURCE_CONTENT_TYPE_UNSUPPORTED",
        message: "source content type is not textual",
        retryable: false,
        details: { contentType }
      });
    }

    const body = await readBody(response, maxBytes);
    const decoded = decodeUtf8(body);
    const text = contentType.includes("html") ? htmlToReadableText(decoded) : decoded.trim();
    if (!text) {
      throw new ContentFactoryError({
        code: "SOURCE_EMPTY",
        message: "remote source contains no readable text",
        retryable: false,
        details: { url: current.href }
      });
    }

    return {
      requestedUrl: input.url,
      finalUrl: current.href,
      fetchedAt: new Date().toISOString(),
      accessStatus: "read",
      contentType,
      bytes: body.byteLength,
      text,
      trust: "untrusted",
      instructionPolicy: "data-only",
      locator: { kind: "url", url: current.href },
      redirects
    };
  }
}
