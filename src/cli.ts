import process from "node:process";
import { probeHostContext } from "./host/probe.js";
import { handleMcpRequest, type JsonRpcRequest } from "./mcp.js";

export interface CliDependencies {
  env: Record<string, string | undefined>;
  platform: string;
  write: (value: string) => void;
}

function defaultDependencies(): CliDependencies {
  return {
    env: process.env,
    platform: process.platform,
    write: (value: string) => process.stdout.write(value + "\n")
  };
}

export async function runCli(argv: string[], deps: CliDependencies = defaultDependencies()): Promise<number> {
  const [command, ...rest] = argv;

  if (command === "probe") {
    deps.write(JSON.stringify(probeHostContext({ env: deps.env, platform: deps.platform })));
    return 0;
  }

  if (command === "mcp-request") {
    if (!rest[0]) {
      deps.write(JSON.stringify({ error: "mcp-request requires one JSON-RPC request argument" }));
      return 2;
    }
    try {
      const request = JSON.parse(rest[0]) as JsonRpcRequest;
      deps.write(JSON.stringify(handleMcpRequest(request, { env: deps.env, platform: deps.platform })));
      return 0;
    } catch {
      deps.write(JSON.stringify({ error: "invalid JSON-RPC request" }));
      return 2;
    }
  }

  deps.write("Usage: content-factory <probe|mcp-request>");
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === new URL(`file://${invokedPath}`).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
