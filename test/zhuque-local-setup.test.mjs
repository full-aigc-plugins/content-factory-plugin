import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AI_CONTENT_DETECTOR_CREDENTIAL_REF,
  ZhuqueCredentials,
  defaultZhuqueConfigPath
} from "../adapters/zhuque/credentials.ts";
import { startZhuqueSetupServer } from "../adapters/zhuque/setup-ui.ts";
import { handleMcpRequest } from "../packages/mcp/src/server.ts";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-zhuque-"));
  t.after(async () => { await rm(root, { recursive: true, force: true }); });
  return { root, configPath: path.join(root, "config", "credentials.json") };
}

test("Zhuque setup uses a per-user config path and only resolves its own credential reference", async t => {
  const { configPath } = await fixture(t);
  assert.equal(
    defaultZhuqueConfigPath({ env: { XDG_CONFIG_HOME: "/tmp/xdg-example" }, platform: "darwin" }),
    "/tmp/xdg-example/content-factory/credentials.json"
  );
  const credentials = new ZhuqueCredentials({ configPath, env: {} });
  assert.deepEqual(await credentials.status(), {
    configured: false, source: null, apiVerified: false, detectionVerified: false
  });
  await credentials.save("local-secret-value");
  assert.equal(await credentials.resolve(AI_CONTENT_DETECTOR_CREDENTIAL_REF), "local-secret-value");
  assert.equal(await credentials.resolve("CONTENT_PLATFORM_PRIMARY"), null);
  assert.deepEqual(await credentials.status(), {
    configured: true, source: "user-config", apiVerified: false, detectionVerified: false
  });

  const override = new ZhuqueCredentials({
    configPath,
    env: { ZHUQUE_API_KEY: "process-secret-value" }
  });
  assert.equal(await override.resolve(AI_CONTENT_DETECTOR_CREDENTIAL_REF), "process-secret-value");
  assert.equal((await override.status()).source, "environment");
});

test("Zhuque setup saves atomically with private Unix permissions and rejects a symlink target", async t => {
  const { root, configPath } = await fixture(t);
  const credentials = new ZhuqueCredentials({ configPath, env: {} });
  await credentials.save("first-secret-value");
  await credentials.save("rotated-secret-value");
  const raw = await readFile(configPath, "utf8");
  assert.equal(JSON.parse(raw).ZHUQUE_API_KEY, "rotated-secret-value");
  if (process.platform !== "win32") {
    assert.equal((await lstat(configPath)).mode & 0o077, 0);
    assert.equal((await lstat(path.dirname(configPath))).mode & 0o077, 0);
  }
  const link = path.join(root, "credential-link.json");
  await symlink(configPath, link);
  await assert.rejects(new ZhuqueCredentials({ configPath: link, env: {} }).save("third-secret-value"));
  assert.equal(JSON.parse(await readFile(configPath, "utf8")).ZHUQUE_API_KEY, "rotated-secret-value");
});

test("Zhuque setup serves a loopback-only page and rejects forged writes without disclosing the key", async t => {
  const { configPath } = await fixture(t);
  const credentials = new ZhuqueCredentials({ configPath, env: {} });
  const setup = await startZhuqueSetupServer({ credentials });
  t.after(async () => { await setup.close(); });
  assert.match(setup.url, /^http:\/\/127\.0\.0\.1:\d+\/$/u);

  const page = await fetch(setup.url);
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("cache-control"), "no-store");
  assert.match(page.headers.get("content-security-policy") ?? "", /default-src 'self'/u);
  assert.match(html, /type="password"/u);
  assert.match(html, /class="brand"/u);
  assert.match(html, /class="hero"/u);
  assert.match(html, /class="setup-card"/u);
  assert.match(html, /id="connection-state"/u);
  assert.match(html, /保存成功 ≠ 检测通过/u);
  const stylesheet = await fetch(new URL("style.css", setup.url)).then(value => value.text());
  assert.match(stylesheet, /radial-gradient/u);
  assert.match(stylesheet, /@media \(max-width: 520px\)/u);
  const csrf = html.match(/data-csrf="([^"]+)"/u)?.[1];
  assert.ok(csrf);
  const origin = setup.url.slice(0, -1);
  const body = JSON.stringify({ csrfToken: csrf, apiKey: "browser-secret-value" });
  const request = (headers) => fetch(new URL("api/save", setup.url), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });

  assert.equal((await request({ origin: "https://attacker.example" })).status, 403);
  const forgedHostStatus = await new Promise((resolve, reject) => {
    const forged = httpRequest(new URL("api/save", setup.url), {
      method: "POST",
      headers: {
        host: "attacker.example",
        origin,
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body)
      }
    }, response => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
    });
    forged.on("error", reject);
    forged.end(body);
  });
  assert.equal(forgedHostStatus, 403);
  assert.equal((await fetch(new URL("api/save", setup.url), {
    method: "POST",
    headers: { "content-type": "text/plain", origin },
    body
  })).status, 400);
  assert.equal((await fetch(new URL("api/save", setup.url), {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ csrfToken: csrf, apiKey: "x".repeat(8192) })
  })).status, 400);
  // An invalid CSRF token must fail even when Origin is valid.
  const invalidCsrf = await fetch(new URL("api/save", setup.url), {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ csrfToken: "wrong", apiKey: "browser-secret-value" })
  });
  assert.equal(invalidCsrf.status, 403);
  assert.equal((await credentials.status()).configured, false);

  const response = await request({ origin });
  assert.equal(response.status, 200);
  assert.equal((await response.text()).includes("browser-secret-value"), false);
  const status = await fetch(new URL("api/status", setup.url)).then(value => value.json());
  assert.deepEqual(status, {
    configured: true, source: "user-config", apiVerified: false, detectionVerified: false
  });
  assert.equal(JSON.stringify(status).includes("browser-secret-value"), false);
});

test("CLI Zhuque status is secret-free and never claims API validation", async t => {
  const { root } = await fixture(t);
  const env = { ...process.env, XDG_CONFIG_HOME: root };
  delete env.ZHUQUE_API_KEY;
  const result = spawnSync(process.execPath, ["packages/cli/src/main.ts", "zhuque-status", "--json"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    configured: false, source: null, apiVerified: false, detectionVerified: false
  });
});

test("MCP exposes a discoverable local setup entry and secret-free status", async () => {
  const env = { ZHUQUE_API_KEY: "mcp-secret-value" };
  const listed = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" }, env);
  assert.ok(listed.result.tools.some(tool => tool.name === "content_factory_zhuque_setup"));
  assert.ok(listed.result.tools.some(tool => tool.name === "content_factory_zhuque_status"));

  const status = await handleMcpRequest({
    jsonrpc: "2.0", id: 2, method: "tools/call",
    params: { name: "content_factory_zhuque_status", arguments: {} }
  }, env);
  assert.deepEqual(JSON.parse(status.result.content[0].text), {
    configured: true, source: "environment", apiVerified: false, detectionVerified: false
  });
  assert.equal(JSON.stringify(status).includes("mcp-secret-value"), false);

  let launches = 0;
  const opened = await handleMcpRequest({
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name: "content_factory_zhuque_setup", arguments: {} }
  }, env, async () => {
    launches += 1;
    return "http://127.0.0.1:45678/";
  });
  assert.equal(launches, 1);
  assert.deepEqual(JSON.parse(opened.result.content[0].text), {
    url: "http://127.0.0.1:45678/",
    apiVerified: false,
    detectionVerified: false
  });
});
