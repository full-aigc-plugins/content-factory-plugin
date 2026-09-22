#!/usr/bin/env node
import readline from "node:readline";
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

export async function handleMcpRequest(request: JsonRpcRequest, env: Env = process.env) {
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
      result: { tools: [doctorTool] }
    };
  }

  if (request.method === "tools/call") {
    const params = request.params ?? {};
    if (params.name !== doctorTool.name) {
      return {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: { code: -32602, message: "unknown tool" }
      };
    }
    const report = await runDoctor({ env, platform: process.platform, arch: process.arch });
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: {
        content: [{ type: "text", text: JSON.stringify(report) }],
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
