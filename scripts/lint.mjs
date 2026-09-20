#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = ["packages", "adapters", "scripts", "test", "tests"];
const extensions = new Set([".ts", ".mjs", ".json", ".md", ".yml", ".yaml"]);

async function filesUnder(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) files.push(...await filesUnder(full));
      else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(full);
    }
    return files;
  } catch {
    return [];
  }
}

const errors = [];
for (const root of roots) {
  for (const file of await filesUnder(root)) {
    const content = await readFile(file, "utf8");
    if (content.includes("\r\n")) errors.push(file + ": CRLF is not allowed");
    if (/^(<<<<<<<|=======|>>>>>>>) /m.test(content)) errors.push(file + ": conflict marker found");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (/[ \t]+$/.test(line)) errors.push(file + ":" + (index + 1) + ": trailing whitespace");
    });
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("lint passed");
}
