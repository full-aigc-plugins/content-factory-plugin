import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const taskFiles = [
  "openspec/changes/establish-content-factory-v1/tasks.md",
  "openspec/changes/implement-content-factory-architecture/tasks.md",
  "openspec/changes/add-platform-aware-content-orchestration/tasks.md"
];

test("CF-001 through CF-058 each retain evidence and task status matches it", () => {
  const evidence = new Map();
  for (let sequence = 1; sequence <= 58; sequence += 1) {
    const task = `CF-${String(sequence).padStart(3, "0")}`;
    const relativePath = `docs/verification/tasks/${task}.json`;
    const absolutePath = path.join(root, relativePath);
    assert.equal(existsSync(absolutePath), true, `${task} must retain structured evidence`);
    const record = JSON.parse(readFileSync(absolutePath, "utf8"));
    assert.equal(record.task, task);
    assert.ok(["COMPLETE", "PARTIAL_OFFLINE"].includes(record.status), `${task} has an unsupported status`);
    assert.equal(record.secrets_in_record, false, `${task} evidence must not contain secrets`);
    if (record.status === "PARTIAL_OFFLINE") {
      assert.match(JSON.stringify(record), /NOT_RUN/u, `${task} must identify the skipped live or human evidence`);
    }
    evidence.set(task, record.status);
  }

  const occurrences = new Map();
  for (const relativePath of taskFiles) {
    const lines = readFileSync(path.join(root, relativePath), "utf8").split(/\r?\n/u);
    for (const [offset, line] of lines.entries()) {
      const match = line.match(/^- \[([ x])\].*\b(CF-\d{3})\b/u);
      if (!match) {
        continue;
      }
      const [, checked, task] = match;
      const expected = evidence.get(task) === "COMPLETE" ? "x" : " ";
      assert.equal(checked, expected, `${relativePath}:${offset + 1} disagrees with ${task} evidence`);
      occurrences.set(task, (occurrences.get(task) ?? 0) + 1);
    }
  }
  for (const task of evidence.keys()) {
    assert.ok(occurrences.has(task), `${task} must appear in an OpenSpec task list`);
  }
});
