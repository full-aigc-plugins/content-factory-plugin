import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runDoctor } from "../packages/core/src/doctor.ts";
import { handleMcpRequest } from "../packages/mcp/src/server.ts";

test("unknown host stays unknown and doctor performs zero paid calls", async () => {
  const report = await runDoctor({
    env: {},
    platform: "linux",
    arch: "x64"
  });

  assert.equal(report.host.id, "unknown");
  assert.equal(report.host.status, "unknown");
  assert.equal(report.paidCalls, 0);
  assert.equal(report.capabilities.search.status, "unknown");
  assert.equal(report.capabilities.browser.status, "unknown");
  assert.equal(report.capabilities.imageFactory.status, "unknown");
});

test("Codex explicit capability manifest is recognized without inventing missing tools", async () => {
  const report = await runDoctor({
    env: {
      CONTENT_FACTORY_HOST_ID: "codex",
      CONTENT_FACTORY_HOST_VERSION: "1.2.3",
      CONTENT_FACTORY_HOST_CAPABILITIES: "search,browser,image-factory"
    },
    platform: "darwin",
    arch: "arm64"
  });

  assert.deepEqual(report.host, { id: "codex", version: "1.2.3", status: "supported" });
  assert.equal(report.capabilities.search.status, "available");
  assert.equal(report.capabilities.browser.status, "available");
  assert.equal(report.capabilities.imageFactory.status, "available");
  assert.equal(report.capabilities.credentialStore.status, "unknown");
  assert.equal(report.paidCalls, 0);
});

test("ZCode and Kimi are recognized host identities", async () => {
  for (const id of ["zcode", "kimi"]) {
    const report = await runDoctor({
      env: { CONTENT_FACTORY_HOST_ID: id },
      platform: "linux",
      arch: "x64"
    });
    assert.equal(report.host.id, id);
    assert.equal(report.host.status, "supported");
    assert.equal(report.paidCalls, 0);
  }
});

test("explicit unavailable capability stays unavailable", async () => {
  const report = await runDoctor({
    env: {
      CONTENT_FACTORY_HOST_ID: "codex",
      CONTENT_FACTORY_HOST_CAPABILITIES: "search,!browser,!image-factory"
    },
    platform: "linux",
    arch: "x64"
  });

  assert.equal(report.capabilities.search.status, "available");
  assert.equal(report.capabilities.browser.status, "unavailable");
  assert.equal(report.capabilities.imageFactory.status, "unavailable");
});

test("CLI doctor --json returns the shared doctor contract", () => {
  const cli = spawnSync(process.execPath, [path.resolve("packages/cli/src/main.ts"), "doctor", "--json"], {
    env: {
      ...process.env,
      CONTENT_FACTORY_HOST_ID: "codex",
      CONTENT_FACTORY_HOST_CAPABILITIES: "search,!browser"
    },
    encoding: "utf8"
  });

  assert.equal(cli.status, 0, cli.stderr);
  const report = JSON.parse(cli.stdout);
  assert.equal(report.host.id, "codex");
  assert.equal(report.capabilities.search.status, "available");
  assert.equal(report.capabilities.browser.status, "unavailable");
  assert.equal(report.paidCalls, 0);
});

test("MCP doctor tool delegates to the same domain service", async () => {
  const list = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  }, {
    CONTENT_FACTORY_HOST_ID: "kimi",
    CONTENT_FACTORY_HOST_CAPABILITIES: "browser"
  });
  assert.equal(list.result.tools[0].name, "content_factory_doctor");

  const call = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "content_factory_doctor", arguments: {} }
  }, {
    CONTENT_FACTORY_HOST_ID: "kimi",
    CONTENT_FACTORY_HOST_CAPABILITIES: "browser"
  });
  const report = JSON.parse(call.result.content[0].text);
  assert.equal(report.host.id, "kimi");
  assert.equal(report.capabilities.browser.status, "available");
  assert.equal(report.paidCalls, 0);
});

test("stage result schema declares deterministic status and evidence fields", async () => {
  const schema = JSON.parse(await readFile("schemas/stage-result.schema.json", "utf8"));
  assert.deepEqual(schema.required, ["stageId", "status", "outputRefs", "evidenceRefs", "externalCalls"]);
  assert.ok(schema.properties.status.enum.includes("blocked"));
  assert.ok(schema.properties.status.enum.includes("succeeded"));
});


test("package exposes lint, typecheck and build engineering gates", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  for (const name of ["lint", "typecheck", "build"]) {
    assert.equal(typeof pkg.scripts?.[name], "string", `missing npm script: ${name}`);
    assert.ok(pkg.scripts[name].length > 0);
  }
});
