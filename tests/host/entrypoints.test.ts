import assert from "node:assert/strict";
import test from "node:test";
import { runCli } from "../../src/cli.js";
import { handleMcpRequest } from "../../src/mcp.js";

test("CLI probe emits one JSON HostContext document", async () => {
  const output: string[] = [];
  const code = await runCli(["probe"], {
    env: { CONTENT_FACTORY_HOST: "codex" },
    platform: "darwin",
    write: (value) => output.push(value)
  });

  assert.equal(code, 0);
  assert.equal(output.length, 1);
  const parsed = JSON.parse(output[0]!);
  assert.equal(parsed.hostId, "codex");
});

test("MCP probe returns HostContext as JSON-RPC result", () => {
  const response = handleMcpRequest(
    { jsonrpc: "2.0", id: 7, method: "content_factory.probe", params: {} },
    { env: { CONTENT_FACTORY_HOST: "kimi" }, platform: "linux" }
  );

  assert.equal(response.jsonrpc, "2.0");
  assert.equal(response.id, 7);
  assert.equal((response.result as { hostId: string }).hostId, "kimi");
});

test("MCP rejects unknown methods without inventing a capability", () => {
  const response = handleMcpRequest(
    { jsonrpc: "2.0", id: 8, method: "content_factory.publish", params: {} },
    { env: {}, platform: "linux" }
  );

  assert.equal(response.error?.code, -32601);
});
