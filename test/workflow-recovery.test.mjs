import assert from "node:assert/strict";
import test from "node:test";

import { WorkflowRunner } from "../packages/core/src/workflow/runner.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";
import { manageCloseable, temporaryDirectory } from "../tests/support/temp-directory.ts";

async function workspace(t) {
  const root = await temporaryDirectory(t, "content-factory-runner-");
  const store = await openWorkspace(root);
  manageCloseable(t, store);
  return store;
}

test("CF-012 restart resumes from the next durable checkpoint without repeating external calls", async t => {
  const store = await workspace(t);
  const first = new WorkflowRunner(store);
  first.createRun({
    runId: "run_resume",
    steps: [
      { stageId: "research", inputHash: "a".repeat(64) },
      { stageId: "write", inputHash: "b".repeat(64) }
    ]
  });

  const research = first.next("run_resume");
  assert.equal(research?.stageId, "research");
  const output = await store.putObject(Buffer.from("verified research output"));
  const submitted = first.submit("run_resume", "research", {
    outputSha256: output.sha256,
    evidenceRefs: ["receipt:research"],
    externalCalls: 1
  });
  assert.equal(submitted.status, "succeeded");
  first.close();

  const resumed = new WorkflowRunner(store);
  manageCloseable(t, resumed);
  const next = resumed.next("run_resume");
  assert.equal(next?.stageId, "write");
  assert.equal(resumed.getRun("run_resume")?.externalCalls, 1);
  assert.equal(resumed.getStep("run_resume", "research")?.status, "succeeded");
});

test("CF-012 cancelled run ignores a late artifact and does not advance the running step", async t => {
  const store = await workspace(t);
  const runner = new WorkflowRunner(store);
  manageCloseable(t, runner);
  runner.createRun({
    runId: "run_cancel",
    steps: [{ stageId: "generate", inputHash: "c".repeat(64) }]
  });

  assert.equal(runner.next("run_cancel")?.status, "running");
  runner.cancel("run_cancel", "user_cancelled");
  const output = await store.putObject(Buffer.from("late artifact"));
  const result = runner.submit("run_cancel", "generate", {
    outputSha256: output.sha256,
    evidenceRefs: ["receipt:late"],
    externalCalls: 1
  });

  assert.equal(result.status, "ignored_cancelled");
  assert.equal(runner.getRun("run_cancel")?.status, "cancelled");
  assert.equal(runner.getStep("run_cancel", "generate")?.status, "running");
  assert.equal(runner.getRun("run_cancel")?.externalCalls, 0);
});

test("CF-012 rejects output not present in the immutable object store", async t => {
  const store = await workspace(t);
  const runner = new WorkflowRunner(store);
  manageCloseable(t, runner);
  runner.createRun({
    runId: "run_missing",
    steps: [{ stageId: "write", inputHash: "d".repeat(64) }]
  });
  runner.next("run_missing");

  assert.throws(
    () => runner.submit("run_missing", "write", {
      outputSha256: "f".repeat(64),
      evidenceRefs: [],
      externalCalls: 0
    }),
    error => error?.code === "WORKFLOW_OUTPUT_MISSING"
  );
});

test("CF-012 workflow events are durable and strictly monotonic per run", async t => {
  const store = await workspace(t);
  const runner = new WorkflowRunner(store);
  manageCloseable(t, runner);
  runner.createRun({
    runId: "run_events",
    steps: [{ stageId: "format", inputHash: "e".repeat(64) }]
  });
  runner.next("run_events");
  const output = await store.putObject(Buffer.from("formatted"));
  runner.submit("run_events", "format", {
    outputSha256: output.sha256,
    evidenceRefs: ["format:ok"],
    externalCalls: 0
  });

  const events = runner.events("run_events");
  assert.deepEqual(events.map(event => event.sequence), [1, 2, 3, 4]);
  assert.deepEqual(events.map(event => event.type), [
    "run.created", "step.started", "step.succeeded", "run.succeeded"
  ]);
});
