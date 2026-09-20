#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const vendor = path.resolve("scripts/vendor/skill_vendor.mjs");
const result = spawnSync(process.execPath, [vendor, "update", ...process.argv.slice(2)], {
  stdio: "inherit"
});
process.exitCode = result.status ?? 1;
