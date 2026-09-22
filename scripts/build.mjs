#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const copyRoots = [
  ".codex-plugin",
  ".zcode-plugin",
  "packages",
  "adapters",
  "profiles",
  "recipes",
  "schemas",
  "skills",
  "templates"
];
for (const root of copyRoots) {
  await cp(root, path.join(output, root), {
    recursive: true,
    filter(source) {
      return !source.includes("node_modules") && !source.includes(path.sep + "dist" + path.sep);
    }
  });
}

for (const file of [
  "LICENSE",
  "README.md",
  "README.zh-CN.md",
  "kimi.plugin.json",
  "package.json",
  "skills.lock.json",
  "plugin-local-skills.json",
  "THIRD_PARTY_NOTICES.md"
]) {
  await cp(file, path.join(output, file));
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const manifest = [];
for (const file of await listFiles(output)) {
  if (file.endsWith("build-manifest.json")) continue;
  const bytes = await readFile(file);
  manifest.push({
    path: path.relative(output, file).split(path.sep).join("/"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length
  });
}
await writeFile(
  path.join(output, "build-manifest.json"),
  JSON.stringify({ schemaVersion: 1, runtime: "node>=24-native-typescript", files: manifest }, null, 2) + "\n"
);
console.log("build passed: " + manifest.length + " files packaged");
