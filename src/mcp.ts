import { probeHostContext, type HostProbeInput } from "./host/probe.js";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

export function handleMcpRequest(request: JsonRpcRequest, probeInput: HostProbeInput): JsonRpcResponse {
  const base = { jsonrpc: "2.0" as const, id: request.id ?? null };

  if (request.method === "content_factory.probe") {
    return { ...base, result: probeHostContext(probeInput) };
  }

  return {
    ...base,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`
    }
  };
}
