import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ZhuqueCredentials } from "./credentials.ts";

const ASSETS = fileURLToPath(new URL("../../assets/zhuque-setup/", import.meta.url));
const MAX_BODY_BYTES = 8192;
const LIFETIME_MS = 600_000;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

function send(response: ServerResponse, status: number, content: Buffer | string, contentType: string): void {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  response.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": bytes.length,
    "Cache-Control": "no-store",
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  response.end(bytes);
}

function json(response: ServerResponse, status: number, value: unknown): void {
  send(response, status, JSON.stringify(value), "application/json; charset=utf-8");
}

function validToken(actual: unknown, expected: string): boolean {
  if (typeof actual !== "string") return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function requestBody(request: IncomingMessage): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers["content-length"]);
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BODY_BYTES) return null;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > MAX_BODY_BYTES) return null;
    chunks.push(bytes);
  }
  if (total !== length) return null;
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export type ZhuqueSetupServer = {
  url: string;
  close(): Promise<void>;
};

export async function startZhuqueSetupServer(input: {
  credentials?: ZhuqueCredentials;
} = {}): Promise<ZhuqueSetupServer> {
  const credentials = input.credentials ?? new ZhuqueCredentials();
  const csrfToken = randomBytes(32).toString("base64url");
  let expectedHost = "";
  let expectedOrigin = "";
  const server = createServer((request, response) => {
    void (async () => {
      if (request.headers.host !== expectedHost) {
        json(response, 403, { ok: false });
        return;
      }
      const pathname = new URL(request.url ?? "/", expectedOrigin).pathname;
      if (request.method === "GET") {
        if (pathname === "/api/status") {
          json(response, 200, await credentials.status());
          return;
        }
        const assets: Record<string, [string, string]> = {
          "/": ["index.html", "text/html; charset=utf-8"],
          "/style.css": ["style.css", "text/css; charset=utf-8"],
          "/app.js": ["app.js", "text/javascript; charset=utf-8"]
        };
        const asset = assets[pathname];
        if (asset) {
          let content = await readFile(path.join(ASSETS, asset[0]));
          if (pathname === "/") {
            content = Buffer.from(content.toString("utf8").replace("__CSRF_TOKEN__", csrfToken));
          }
          send(response, 200, content, asset[1]);
          return;
        }
      }
      if (request.method === "POST" && pathname === "/api/save") {
        if (request.headers.origin !== expectedOrigin) {
          json(response, 403, { ok: false });
          return;
        }
        if (request.headers["content-type"]?.split(";")[0]?.trim() !== "application/json") {
          json(response, 400, { ok: false });
          return;
        }
        const body = await requestBody(request);
        if (!body || !validToken(body.csrfToken, csrfToken) || typeof body.apiKey !== "string") {
          json(response, body ? 403 : 400, { ok: false });
          return;
        }
        try {
          await credentials.save(body.apiKey);
        } catch {
          json(response, 400, { ok: false });
          return;
        }
        json(response, 200, { ok: true, ...await credentials.status() });
        return;
      }
      json(response, 404, { ok: false });
    })().catch(() => {
      if (!response.headersSent) json(response, 500, { ok: false });
      else response.end();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (typeof address !== "object" || address === null) {
    server.close();
    throw new Error("Zhuque setup did not bind to a local port");
  }
  expectedHost = `127.0.0.1:${address.port}`;
  expectedOrigin = `http://${expectedHost}`;
  const timer = setTimeout(() => server.close(), LIFETIME_MS);
  timer.unref();
  return {
    url: `${expectedOrigin}/`,
    async close() {
      clearTimeout(timer);
      if (!server.listening) return;
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  };
}

export function openZhuqueSetupPage(url: string): void {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const arguments_ = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, arguments_, { stdio: "ignore", detached: true });
  child.on("error", () => { /* The CLI prints the URL as a manual fallback. */ });
  child.unref();
}
