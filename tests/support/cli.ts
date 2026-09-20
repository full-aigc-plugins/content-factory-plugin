import { spawnSync } from "node:child_process";
import path from "node:path";

export function runContentFactoryCli(args: string[], env: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, [path.resolve("packages/cli/src/main.ts"), ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}
