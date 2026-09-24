#!/usr/bin/env node
import readline from "node:readline";
import { ZhuqueCredentials } from "../../../adapters/zhuque/credentials.ts";
import { openZhuqueSetupPage, startZhuqueSetupServer } from "../../../adapters/zhuque/setup-ui.ts";
import { runDoctor } from "../../core/src/doctor.ts";
import packageJson from "../../../package.json" with { type: "json" };

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type Env = Record<string, string | undefined>;

const doctorTool = {
  name: "content_factory_doctor",
  description: "Inspect Content Factory host capabilities without performing paid or remote mutation calls.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  }
};

const zhuqueStatusTool = {
  name: "content_factory_zhuque_status",
  description: "Check whether a Zhuque API Key is configured. Never reveals the key or claims API/detection verification.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} }
};

const zhuqueSetupTool = {
  name: "content_factory_zhuque_setup",
  description: "Open the built-in local Zhuque API Key setup page. It does not send article text or call the provider.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} }
};

let activeSetup: { url: string; expiresAt: number } | null = null;

async function launchZhuqueSetup(): Promise<string> {
  if (activeSetup && Date.now() < activeSetup.expiresAt) return activeSetup.url;
  const setup = await startZhuqueSetupServer();
  activeSetup = { url: setup.url, expiresAt: Date.now() + 590_000 };
  openZhuqueSetupPage(setup.url);
  return setup.url;
}

export async function handleMcpRequest(
  request: JsonRpcRequest,
  env: Env = process.env,
  setupLauncher: () => Promise<string> = launchZhuqueSetup
) {
  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "content-factory", version: packageJson.version }
      }
    };
  }

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: { tools: [doctorTool, zhuqueStatusTool, zhuqueSetupTool] }
    };
  }

  if (request.method === "tools/call") {
    const params = request.params ?? {};
    if (![doctorTool.name, zhuqueStatusTool.name, zhuqueSetupTool.name].includes(String(params.name))) {
      return {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: { code: -32602, message: "unknown tool" }
      };
    }
    let result: unknown;
    try {
      if (params.name === doctorTool.name) {
        result = await runDoctor({ env, platform: process.platform, arch: process.arch });
      } else if (params.name === zhuqueStatusTool.name) {
        result = await new ZhuqueCredentials({ env }).status();
      } else {
        result = { url: await setupLauncher(), apiVerified: false, detectionVerified: false };
      }
    } catch {
      return {
        jsonrpc: "2.0",
        id: request.id ?? null,
        result: {
          content: [{ type: "text", text: "Local Zhuque setup is unavailable; check user configuration permissions." }],
          isError: true
        }
      };
    }
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: {
        content: [{ type: "text", text: JSON.stringify(result) }],
        isError: false
      }
    };
  }

  return {
    jsonrpc: "2.0",
    id: request.id ?? null,
    error: { code: -32601, message: "method not found" }
  };
}

export async function serveStdio(env: Env = process.env) {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line) as JsonRpcRequest;
      const response = await handleMcpRequest(request, env);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch (error) {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: error instanceof Error ? error.message : "parse error" }
      }) + "\n");
    }
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await serveStdio();
}
