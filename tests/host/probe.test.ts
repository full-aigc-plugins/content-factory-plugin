import assert from "node:assert/strict";
import test from "node:test";
import { probeHostContext } from "../../src/host/probe.js";

test("explicit host override wins over inferred environment", () => {
  const result = probeHostContext({
    env: {
      CONTENT_FACTORY_HOST: "zcode",
      CODEX_HOME: "/tmp/codex"
    },
    platform: "darwin"
  });
  assert.equal(result.hostId, "zcode");
  assert.equal(result.resolution, "resolved");
});

test("unknown host remains unknown", () => {
  const result = probeHostContext({ env: {}, platform: "linux" });
  assert.equal(result.hostId, "unknown");
  assert.equal(result.resolution, "unknown");
});

test("capability inventory is parsed without network calls", () => {
  let networkCalls = 0;
  const result = probeHostContext({
    env: {
      CONTENT_FACTORY_HOST: "codex",
      CONTENT_FACTORY_CAPABILITIES: JSON.stringify({
        tools: ["web.search", "files.read"],
        browserModes: ["computer-use"],
        credentialRefs: ["wechat-main"],
        externalPlugins: ["image-factory"]
      })
    },
    platform: "linux",
    onNetworkAttempt: () => networkCalls++
  });

  assert.deepEqual(result.availableTools, ["files.read", "web.search"]);
  assert.deepEqual(result.browserModes, ["computer-use"]);
  assert.deepEqual(result.credentialRefs, ["wechat-main"]);
  assert.deepEqual(result.externalPlugins, ["image-factory"]);
  assert.equal(networkCalls, 0);
});

test("malformed capability inventory is reported, not invented", () => {
  const result = probeHostContext({
    env: {
      CONTENT_FACTORY_HOST: "kimi",
      CONTENT_FACTORY_CAPABILITIES: "{not-json"
    },
    platform: "win32"
  });
  assert.equal(result.hostId, "kimi");
  assert.deepEqual(result.availableTools, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0]!, /CONTENT_FACTORY_CAPABILITIES/);
});
