export interface WechatDraftRequest {
  method: "POST";
  url: string;
  body?: unknown;
}

export interface WechatDraftResponse {
  status: number;
  body: unknown;
}

export interface WechatDraftTransport {
  request(request: WechatDraftRequest): Promise<WechatDraftResponse>;
}

export interface WechatArticleInput {
  title: string;
  content: string;
  author?: string;
  digest?: string;
  thumb_media_id?: string;
  content_source_url?: string;
  need_open_comment?: 0 | 1;
  only_fans_can_comment?: 0 | 1;
}

export type WechatCreateStatus =
  | "blocked"
  | "failed"
  | "unknown"
  | "submitted_unverified";

export interface WechatDraftCreateReceipt {
  status: WechatCreateStatus;
  bundleHash: string;
  remoteId?: string;
  httpStatus?: number;
  rawResponse?: unknown;
  error?: string;
}

export interface CreateWechatDraftOptions {
  accessToken: string;
  bundleHash: string;
  articles: WechatArticleInput[];
  transport: WechatDraftTransport;
  endpointBase?: string;
}

export interface ReadWechatDraftOptions {
  accessToken: string;
  remoteId: string;
  transport: WechatDraftTransport;
  endpointBase?: string;
}

export interface WechatDraftReadReceipt {
  status: "blocked" | "failed" | "read";
  remoteId: string;
  httpStatus?: number;
  rawResponse?: unknown;
  error?: string;
}

interface WechatApplicationError {
  errcode?: unknown;
  errmsg?: unknown;
}

function endpoint(base: string, path: string, token: string): string {
  const normalized = base.replace(/\/$/, "");
  return `${normalized}/cgi-bin/draft/${path}?access_token=${encodeURIComponent(token)}`;
}

function applicationError(body: unknown): { code: number; message: string } | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const candidate = body as WechatApplicationError;
  if (typeof candidate.errcode !== "number" || candidate.errcode === 0) return undefined;
  return {
    code: candidate.errcode,
    message: typeof candidate.errmsg === "string" ? candidate.errmsg : "unknown application error"
  };
}

function mediaId(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const value = (body as { media_id?: unknown }).media_id;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function createWechatDraft(
  options: CreateWechatDraftOptions
): Promise<WechatDraftCreateReceipt> {
  const base = options.endpointBase ?? "https://api.weixin.qq.com";
  if (!options.accessToken.trim()) {
    return {
      status: "blocked",
      bundleHash: options.bundleHash,
      error: "WeChat access token is required before remote mutation"
    };
  }

  let response: WechatDraftResponse;
  try {
    response = await options.transport.request({
      method: "POST",
      url: endpoint(base, "add", options.accessToken),
      body: { articles: options.articles }
    });
  } catch (error) {
    return {
      status: "unknown",
      bundleHash: options.bundleHash,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  if (response.status < 200 || response.status >= 300) {
    return {
      status: "failed",
      bundleHash: options.bundleHash,
      httpStatus: response.status,
      rawResponse: response.body,
      error: `WeChat HTTP ${response.status}`
    };
  }

  const appError = applicationError(response.body);
  if (appError) {
    return {
      status: "failed",
      bundleHash: options.bundleHash,
      httpStatus: response.status,
      rawResponse: response.body,
      error: `WeChat error ${appError.code}: ${appError.message}`
    };
  }

  const remoteId = mediaId(response.body);
  if (!remoteId) {
    return {
      status: "failed",
      bundleHash: options.bundleHash,
      httpStatus: response.status,
      rawResponse: response.body,
      error: "WeChat draft response did not include media_id"
    };
  }

  return {
    status: "submitted_unverified",
    bundleHash: options.bundleHash,
    remoteId,
    httpStatus: response.status,
    rawResponse: response.body
  };
}

export async function readWechatDraft(
  options: ReadWechatDraftOptions
): Promise<WechatDraftReadReceipt> {
  const base = options.endpointBase ?? "https://api.weixin.qq.com";
  if (!options.accessToken.trim()) {
    return {
      status: "blocked",
      remoteId: options.remoteId,
      error: "WeChat access token is required before readback"
    };
  }

  let response: WechatDraftResponse;
  try {
    response = await options.transport.request({
      method: "POST",
      url: endpoint(base, "get", options.accessToken),
      body: { media_id: options.remoteId }
    });
  } catch (error) {
    return {
      status: "failed",
      remoteId: options.remoteId,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  if (response.status < 200 || response.status >= 300) {
    return {
      status: "failed",
      remoteId: options.remoteId,
      httpStatus: response.status,
      rawResponse: response.body,
      error: `WeChat HTTP ${response.status}`
    };
  }

  const appError = applicationError(response.body);
  if (appError) {
    return {
      status: "failed",
      remoteId: options.remoteId,
      httpStatus: response.status,
      rawResponse: response.body,
      error: `WeChat error ${appError.code}: ${appError.message}`
    };
  }

  return {
    status: "read",
    remoteId: options.remoteId,
    httpStatus: response.status,
    rawResponse: response.body
  };
}
