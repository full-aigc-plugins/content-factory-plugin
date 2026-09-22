#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { runDoctor } from "../../core/src/doctor.ts";

export async function runCli(
  argv: string[] = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env
): Promise<number> {
  const [command, ...args] = argv;
  if (command !== "doctor") {
    console.error(JSON.stringify({
      error: { code: "UNKNOWN_COMMAND", message: "supported command: doctor", retryable: false }
    }));
    return 2;
  }

  const report = await runDoctor({ env, platform: process.platform, arch: process.arch });
  if (args.includes("--json")) console.log(JSON.stringify(report));
  else {
    console.log(`Content Factory doctor: host=${report.host.id} status=${report.host.status}`);
    for (const [name, capability] of Object.entries(report.capabilities)) {
      console.log(`- ${name}: ${capability.status}`);
    }
  }
  return 0;
}

if (
  process.argv[1] !== undefined
  && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
) {
  process.exitCode = await runCli();
}
