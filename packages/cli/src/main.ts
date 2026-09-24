#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ZhuqueCredentials } from "../../../adapters/zhuque/credentials.ts";
import { openZhuqueSetupPage, startZhuqueSetupServer } from "../../../adapters/zhuque/setup-ui.ts";
import { runDoctor } from "../../core/src/doctor.ts";

export async function runCli(
  argv: string[] = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env
): Promise<number> {
  const [command, ...args] = argv;
  if (command === "zhuque-status") {
    const result = await new ZhuqueCredentials({ env }).status();
    if (args.includes("--json")) console.log(JSON.stringify(result));
    else console.log(result.configured
      ? `Zhuque API Key is configured via ${result.source}; API and detection are not verified.`
      : "Zhuque API Key is not configured; API and detection are not verified.");
    return 0;
  }
  if (command === "zhuque-setup") {
    const setup = await startZhuqueSetupServer({ credentials: new ZhuqueCredentials({ env }) });
    console.log(`Content Factory Zhuque setup: ${setup.url}`);
    console.log("The local page closes after ten minutes. Saving a key does not verify the API or detect content.");
    if (!args.includes("--no-open")) openZhuqueSetupPage(setup.url);
    return 0;
  }
  if (command !== "doctor") {
    console.error(JSON.stringify({
      error: {
        code: "UNKNOWN_COMMAND",
        message: "supported commands: doctor, zhuque-status, zhuque-setup",
        retryable: false
      }
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
