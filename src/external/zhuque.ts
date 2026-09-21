import { createHash } from "node:crypto";

export const DEFAULT_ZHUQUE_ENDPOINT =
  "https://ai-gateway.edgeone.link/v1/providers/zhuque-text/classify";

export interface HttpRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type HttpFetch = (url: string, init?: HttpRequestInit) => Promise<HttpResponse>;

export type ExternalRequestStatus = "blocked" | "succeeded" | "failed";

export interface ZhuqueProbeReceipt {
  provider: "zhuque-text";
  endpoint: string;
  checkedAt: string;
  requestStatus: ExternalRequestStatus;
  submittedSha256: string;
  submittedBytes: number;
  httpStatus?: number;
  rawResponse?: unknown;
  normalized?: unknown;
  error?: string;
}

export interface ZhuqueProbeOptions {
  token: string;
  text: string;
  fetch: HttpFetch;
  endpoint?: string;
  checkedAt?: string;
}

function evidenceFor(text: string): { sha256: string; bytes: number } {
  const bytes = Buffer.from(text, "utf8");
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength
  };
}

export async function probeZhuqueContract(options: ZhuqueProbeOptions): Promise<ZhuqueProbeReceipt> {
  const endpoint = options.endpoint ?? DEFAULT_ZHUQUE_ENDPOINT;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const evidence = evidenceFor(options.text);
  const base: Omit<ZhuqueProbeReceipt, "requestStatus"> = {
    provider: "zhuque-text",
    endpoint,
    checkedAt,
    submittedSha256: evidence.sha256,
    submittedBytes: evidence.bytes
  };

  if (!options.token.trim()) {
    return {
      ...base,
      requestStatus: "blocked",
      error: "Zhuque token is required before any network request"
    };
  }

  let response: HttpResponse;
  try {
    response = await options.fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: options.text })
    });
  } catch (error) {
    return {
      ...base,
      requestStatus: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }

  let rawResponse: unknown;
  try {
    rawResponse = await response.json();
  } catch {
    try {
      rawResponse = await response.text();
    } catch {
      rawResponse = undefined;
    }
  }

  if (!response.ok) {
    return {
      ...base,
      requestStatus: "failed",
      httpStatus: response.status,
      rawResponse,
      error: `Zhuque HTTP ${response.status}`
    };
  }

  return {
    ...base,
    requestStatus: "succeeded",
    httpStatus: response.status,
    rawResponse
  };
}
