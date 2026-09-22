#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const jsonOutput = process.argv.includes("--json");
const root = process.cwd();

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

async function present(relative) {
  try {
    await access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

const packageJson = await readJson("package.json");
const skillLock = await readJson("skills.lock.json");
const notices = await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
const dependencies = Object.entries(packageJson.dependencies ?? {});
const runtimeDependenciesPinned = dependencies.every(([, version]) =>
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)
);
const runtimeDependencyNoticesPresent = dependencies.every(([name, version]) =>
  notices.includes(`${name}@${version}`)
);
const offlineVendorCheck = spawnSync(
  process.execPath,
  [path.join(root, "scripts/vendor/skill_vendor.mjs"), "check", "--root", root, "--offline"],
  { cwd: root, encoding: "utf8" }
);
const vendorLocksImmutable = offlineVendorCheck.status === 0
  && skillLock.sources.every(source =>
    /^v\d+\.\d+\.\d+$/u.test(source.ref)
    && /^[0-9a-f]{40}$/u.test(source.sha)
    && source.skills.every(skill => /^[0-9a-f]{64}$/u.test(source.sha256?.[skill] ?? ""))
  );
const vendorLicenseEvidencePresent = skillLock.sources.every(source =>
  typeof source.license?.spdx === "string"
  && source.license.spdx.length > 0
  && typeof source.license?.evidence === "string"
  && /^https:\/\//u.test(source.license.evidence)
  && notices.includes(source.repo.replace(/\.git$/u, ""))
  && notices.includes(source.ref)
  && notices.includes(source.sha)
  && notices.includes(source.license.spdx)
);
const checks = {
  runtimeDependenciesPinned,
  runtimeDependencyNoticesPresent,
  vendorLocksImmutable,
  vendorLicenseEvidencePresent,
  pluginLicensePresent: await present("LICENSE"),
  buildGateDeclared: typeof packageJson.scripts?.build === "string"
};
const failed = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  schemaVersion: 1,
  status: failed.length === 0 ? "passed" : "failed",
  checks,
  failed
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(report)}\n`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
if (failed.length > 0) process.exitCode = 1;
