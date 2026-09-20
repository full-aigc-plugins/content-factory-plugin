#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_TAG = /^v\d+\.\d+\.\d+$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

class ValidationError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, offline: false, root: process.cwd(), sourcePaths: new Map() };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--offline") options.offline = true;
    else if (arg === "--root") options.root = path.resolve(rest[++i]);
    else if (arg === "--source-path") {
      const value = rest[++i] ?? "";
      const at = value.indexOf("=");
      if (at < 1 || at === value.length - 1) {
        throw new ValidationError("--source-path must be PACKAGE=PATH");
      }
      options.sourcePaths.set(value.slice(0, at), path.resolve(value.slice(at + 1)));
    } else {
      throw new ValidationError(`unknown argument: ${arg}`);
    }
  }
  if (!["check", "update"].includes(command)) {
    throw new ValidationError("usage: skill_vendor.mjs <check|update> [--offline] [--root PATH] [--source-path PACKAGE=PATH]");
  }
  return options;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new ValidationError(`cannot read JSON ${file}: ${error.message}`);
  }
}

function insideRoot(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new ValidationError(`path escapes repository root: ${relative}`);
  }
  return target;
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const output = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new ValidationError(`symbolic links are not allowed in vendored skills: ${full}`);
    }
    if (entry.isDirectory()) output.push(...await listFiles(root, full));
    else if (entry.isFile()) output.push(full);
  }
  return output;
}

export async function hashSkillDir(skillDir) {
  const digest = createHash("sha256");
  for (const file of await listFiles(skillDir)) {
    const relative = path.relative(skillDir, file).split(path.sep).join("/");
    const bytes = await readFile(file);
    digest.update(relative);
    digest.update("\0");
    digest.update(createHash("sha256").update(bytes).digest("hex"));
    digest.update("\n");
  }
  return digest.digest("hex");
}

function validateLockShape(lock) {
  if (lock?.version !== 1) throw new ValidationError("unsupported skills.lock.json version");
  if (!Array.isArray(lock.sources)) throw new ValidationError("skills.lock.json requires a sources array");
}

function validateSource(source) {
  for (const key of ["package", "repo", "ref", "sha", "skills", "dest", "sha256", "license"]) {
    if (!(key in source)) throw new ValidationError(`source ${source.package ?? "?"}: missing key '${key}'`);
  }
  if (!SEMVER_TAG.test(source.ref)) {
    throw new ValidationError(`${source.package}: ref must be an immutable semantic version tag (vMAJOR.MINOR.PATCH)`);
  }
  if (!COMMIT_SHA.test(source.sha)) {
    throw new ValidationError(`${source.package}: sha must be a 40-character commit SHA`);
  }
  if (!Array.isArray(source.skills) || source.skills.length === 0) {
    throw new ValidationError(`${source.package}: skills must be a non-empty list`);
  }
  if (new Set(source.skills).size !== source.skills.length) {
    throw new ValidationError(`${source.package}: duplicate skill names`);
  }
  for (const skill of source.skills) {
    if (!SKILL_NAME.test(skill)) throw new ValidationError(`${source.package}: illegal skill name '${skill}'`);
    if (!SHA256.test(source.sha256?.[skill] ?? "")) {
      throw new ValidationError(`${source.package}: invalid SHA-256 for ${skill}`);
    }
  }
  if (!source.license || typeof source.license.spdx !== "string" || !source.license.spdx.trim()
      || typeof source.license.evidence !== "string" || !source.license.evidence.trim()) {
    throw new ValidationError(`${source.package}: license provenance is required`);
  }
  if (source.sourceDir !== undefined && (typeof source.sourceDir !== "string" || !source.sourceDir.trim())) {
    throw new ValidationError(`${source.package}: sourceDir must be a non-empty string`);
  }
}

async function validatePluginLocal(root, lock) {
  const policyPath = path.join(root, "plugin-local-skills.json");
  const policy = await readJson(policyPath);
  if (policy?.version !== 1) throw new ValidationError("unsupported plugin-local-skills.json version");
  if (typeof policy.dest !== "string") throw new ValidationError("plugin-local-skills.json requires a dest string");
  if (!Array.isArray(policy.skills)) throw new ValidationError("plugin-local-skills.json requires a skills list");
  if (new Set(policy.skills).size !== policy.skills.length) {
    throw new ValidationError("plugin-local-skills.json contains duplicate skill names");
  }
  for (const skill of policy.skills) {
    if (!SKILL_NAME.test(skill)) throw new ValidationError(`plugin-local-skills.json contains illegal skill name '${skill}'`);
  }

  const destination = insideRoot(root, policy.dest);
  const managed = new Set(
    lock.sources
      .filter(source => insideRoot(root, source.dest) === destination)
      .flatMap(source => source.skills)
  );
  const local = new Set(policy.skills);
  const overlap = [...local].filter(name => managed.has(name)).sort();
  if (overlap.length) {
    throw new ValidationError("plugin-local skills must not appear in skills.lock.json: " + overlap.join(", "));
  }

  let actual = [];
  try {
    actual = (await readdir(destination, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    actual = [];
  }
  const declaredNames = new Set([...managed, ...local]);
  const undeclared = [];
  for (const name of actual) {
    try {
      const skillStat = await stat(path.join(destination, name, "SKILL.md"));
      if (skillStat.isFile() && !declaredNames.has(name)) undeclared.push(name);
    } catch {}
  }
  if (undeclared.length) {
    throw new ValidationError("undeclared plugin-local skills: " + undeclared.sort().join(", "));
  }
  const missingLocal = [];
  for (const name of local) {
    try {
      const s = await stat(path.join(destination, name, "SKILL.md"));
      if (!s.isFile()) missingLocal.push(name);
    } catch {
      missingLocal.push(name);
    }
  }
  if (missingLocal.length) {
    throw new ValidationError("declared plugin-local skills are missing: " + missingLocal.sort().join(", "));
  }
}

function validateCollisions(lock) {
  const owners = new Map();
  for (const source of lock.sources) {
    for (const skill of source.skills) {
      const key = `${source.dest}\0${skill}`;
      if (owners.has(key)) {
        throw new ValidationError(`skill collision: ${skill} managed by both ${owners.get(key)} and ${source.package}`);
      }
      owners.set(key, source.package);
    }
  }
}

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return result.stdout.trim();
}

function resolveRemoteRef(repo, ref) {
  const output = git(["ls-remote", "--tags", repo, `refs/tags/${ref}`, `refs/tags/${ref}^{}`]);
  if (!output) throw new Error(`${repo}: ref ${ref} not found`);
  const rows = output.split(/\r?\n/).map(line => line.split(/\s+/));
  const peeled = rows.find(([, name]) => name === `refs/tags/${ref}^{}`);
  const direct = rows.find(([, name]) => name === `refs/tags/${ref}`);
  return (peeled ?? direct)?.[0];
}

async function verifyManagedSnapshot(root, lock) {
  for (const source of lock.sources) {
    const destination = insideRoot(root, source.dest);
    for (const skill of source.skills) {
      const dir = path.join(destination, skill);
      try {
        const s = await stat(path.join(dir, "SKILL.md"));
        if (!s.isFile()) throw new Error();
      } catch {
        throw new ValidationError(`${source.package}: managed skill is missing: ${skill}`);
      }
      const digest = await hashSkillDir(dir);
      if (digest !== source.sha256[skill]) {
        throw new ValidationError(`${source.package}: digest drift for ${skill}`);
      }
    }
  }
}

async function loadAndValidate(root) {
  const lockPath = path.join(root, "skills.lock.json");
  const lock = await readJson(lockPath);
  validateLockShape(lock);
  for (const source of lock.sources) {
    validateSource(source);
    insideRoot(root, source.dest);
    if (source.sourceDir) insideRoot(root, source.sourceDir);
  }
  validateCollisions(lock);
  await validatePluginLocal(root, lock);
  return { lock, lockPath };
}

async function check(root, offline) {
  const { lock } = await loadAndValidate(root);
  await verifyManagedSnapshot(root, lock);
  if (!offline) {
    for (const source of lock.sources) {
      const resolved = resolveRemoteRef(source.repo, source.ref);
      if (resolved !== source.sha) {
        throw new ValidationError(`${source.package}: pinned ref resolved to ${resolved}, expected ${source.sha}`);
      }
    }
  }
  console.log(`skill supply chain check passed (${lock.sources.length} source(s))`);
}

async function checkoutSource(source, sourcePath, temporaryRoot) {
  if (sourcePath) {
    const commit = git(["rev-parse", `${source.ref}^{commit}`], sourcePath);
    const head = git(["rev-parse", "HEAD"], sourcePath);
    if (head !== commit) {
      throw new ValidationError(`${source.package}: local source HEAD must equal pinned tag ${source.ref}`);
    }
    return { checkout: sourcePath, commit };
  }

  const checkout = path.join(temporaryRoot, source.package.replace(/[^a-zA-Z0-9._-]/g, "_"));
  await mkdir(checkout, { recursive: true });
  git(["init", "-q"], checkout);
  git(["remote", "add", "origin", source.repo], checkout);
  git(["fetch", "-q", "--depth", "1", "origin", `refs/tags/${source.ref}`], checkout);
  git(["checkout", "-q", "--detach", "FETCH_HEAD"], checkout);
  return { checkout, commit: git(["rev-parse", "HEAD"], checkout) };
}

async function update(root, sourcePaths) {
  const { lock, lockPath } = await loadAndValidate(root);
  for (const packageName of sourcePaths.keys()) {
    if (!lock.sources.some(source => source.package === packageName)) {
      throw new ValidationError(`--source-path references unknown package: ${packageName}`);
    }
  }

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "content-factory-vendor-"));
  try {
    for (const source of lock.sources) {
      const { checkout, commit } = await checkoutSource(source, sourcePaths.get(source.package), temporaryRoot);
      const sourceBase = path.resolve(checkout, source.sourceDir ?? "skills");
      const destination = insideRoot(root, source.dest);
      await mkdir(destination, { recursive: true });

      for (const skill of source.skills) {
        const from = path.join(sourceBase, skill);
        try {
          const s = await stat(path.join(from, "SKILL.md"));
          if (!s.isFile()) throw new Error();
        } catch {
          throw new ValidationError(`${source.package}: upstream skill is missing: ${skill}`);
        }
        const to = path.join(destination, skill);
        await rm(to, { recursive: true, force: true });
        await cp(from, to, { recursive: true, force: true, errorOnExist: false });
        source.sha256[skill] = await hashSkillDir(to);
      }
      source.sha = commit;
      console.log(`updated ${source.package}@${source.ref} -> ${commit}`);
    }
    await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n");
    await check(root, true);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.command === "check") await check(options.root, options.offline);
    else await update(options.root, options.sourcePaths);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`ERROR: ${error.message}`);
      process.exitCode = 2;
    } else {
      console.error(`ERROR: ${error?.message ?? error}`);
      process.exitCode = 1;
    }
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
