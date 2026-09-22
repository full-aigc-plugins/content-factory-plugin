import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { approveDeliveryIntent } from "../../packages/core/src/delivery/approve.ts";
import { createDeliveryIntent } from "../../packages/core/src/delivery/intents.ts";
import { prepareReleaseBundle } from "../../packages/core/src/delivery/prepare.ts";
import { submitApprovedDraft } from "../../packages/core/src/delivery/submit.ts";
import { verifyDraftReadback } from "../../packages/core/src/delivery/verify.ts";
import { runDetection } from "../../packages/core/src/detection/zhuque.ts";
import { WorkflowRunner } from "../../packages/core/src/workflow/runner.ts";
import { backupWorkspaceDatabase } from "../../packages/core/src/workspace/backup.ts";
import { openWorkspace } from "../../packages/core/src/workspace/store.ts";

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-chaos-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

function childCrashScript(root) {
  const storeUrl = pathToFileURL(path.resolve("packages/core/src/workspace/store.ts")).href;
  const runnerUrl = pathToFileURL(path.resolve("packages/core/src/workflow/runner.ts")).href;
  return `
    import { openWorkspace } from ${JSON.stringify(storeUrl)};
    import { WorkflowRunner } from ${JSON.stringify(runnerUrl)};
    const store = await openWorkspace(${JSON.stringify(root)});
    const runner = new WorkflowRunner(store);
    runner.createRun({
      runId: "run-crash",
      steps: [{ stageId: "remote-draft", inputHash: "${"a".repeat(64)}" }]
    });
    runner.next("run-crash");
    process.stdout.write("checkpoint-persisted");
    process.exit(0);
  `;
}

function delivery() {
  const bundle = prepareReleaseBundle({
    bundleId: "bundle-1",
    variantRef: "variant-1",
    contentRevisionId: "revision-1",
    packageStatus: "verified",
    targetAccountAlias: "内容平台主账号",
    title: "标题",
    summary: "摘要",
    body: "正文",
    assets: [{ artifactId: "cover", sha256: "a".repeat(64), order: 0 }],
    detectionReviewRef: "review-1"
  });
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle,
    preflight: {
      status: "ready",
      accountAlias: bundle.targetAccountAlias,
      deliveryMethod: "api-draft"
    }
  });
  const approval = approveDeliveryIntent({
    intent,
    actor: { kind: "human", id: "editor-1" },
    interactionTrusted: true,
    approvedAt: "2026-09-22T17:00:00.000Z"
  });
  return { bundle, intent, approval };
}

test("CF-038 hard-killed writer releases a stale lease and resumes its durable checkpoint", async t => {
  const root = await sandbox(t);
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", childCrashScript(root)],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, "checkpoint-persisted");

  const store = await openWorkspace(root);
  t.after(async () => store.close());
  const runner = new WorkflowRunner(store);
  t.after(() => runner.close());
  const resumed = runner.next("run-crash");

  assert.equal(resumed?.stageId, "remote-draft");
  assert.equal(resumed?.status, "running");
  assert.equal(resumed?.externalCalls, 0);
  assert.deepEqual(runner.events("run-crash").map(event => event.type), [
    "run.created", "step.started"
  ]);

  const backupPath = path.join(root, "backups", "workspace.db");
  const backup = await backupWorkspaceDatabase(store.stateDir, backupPath);
  assert.equal((await stat(backup.path)).isFile(), true);
  assert.match(backup.sha256, /^[0-9a-f]{64}$/u);
  const backupDb = new DatabaseSync(backup.path, { readOnly: true });
  t.after(() => backupDb.close());
  const row = backupDb.prepare(
    "SELECT status FROM workflow_runs WHERE run_id = ?"
  ).get("run-crash");
  assert.equal(row?.status, "running");
});

test("CF-038 simulated storage failure does not commit dangling object metadata", async t => {
  const root = await sandbox(t);
  const store = await openWorkspace(root);
  t.after(async () => store.close());
  const bytes = Buffer.from("must-not-be-registered");
  const digest = createHash("sha256").update(bytes).digest("hex");
  await rm(store.objectsDir, { recursive: true, force: true });
  await writeFile(store.objectsDir, "not-a-directory");

  await assert.rejects(store.putObject(bytes));
  assert.equal(store.getObjectRecord(digest), null);
});

test("CF-038 live writer lease still blocks a competing writer", async t => {
  const root = await sandbox(t);
  const first = await openWorkspace(root);
  t.after(async () => first.close());

  await assert.rejects(
    openWorkspace(root),
    error => error?.code === "WORKSPACE_LOCKED"
  );
});

test("CF-038 unknown draft write is never repeated and external edits remain conflict", async t => {
  const root = await sandbox(t);
  const store = await openWorkspace(root);
  t.after(async () => store.close());
  const context = delivery();
  let draftWrites = 0;
  const port = {
    async uploadAsset() {
      return { remoteAssetId: "remote-cover" };
    },
    async createDraft() {
      draftWrites += 1;
      throw Object.assign(new Error("network disconnected after write"), {
        outcomeUnknown: true
      });
    }
  };

  const first = await submitApprovedDraft({
    ...context,
    requestId: "request-unknown",
    store,
    port
  });
  const resumed = await submitApprovedDraft({
    ...context,
    requestId: "request-unknown",
    store,
    port
  });
  assert.equal(first.status, "unknown");
  assert.equal(resumed.status, "unknown");
  assert.equal(draftWrites, 1);

  const verification = verifyDraftReadback({
    bundle: context.bundle,
    expectedRemoteAssetIds: ["remote-cover"],
    remoteDraft: {
      remoteDraftId: "draft-remote",
      title: "后台人工修改的标题",
      summary: context.bundle.summary,
      body: context.bundle.body,
      remoteAssetIds: ["remote-cover"]
    }
  });
  assert.equal(verification.status, "conflict");
  assert.deepEqual(verification.differences.map(item => item.field), ["title"]);
});

test("CF-038 detector network loss and schema drift never report success", async () => {
  const rawBodies = [];
  const store = {
    async putRaw(rawBody) {
      rawBodies.push(Buffer.from(rawBody).toString("utf8"));
      return {
        sha256: createHash("sha256").update(rawBody).digest("hex"),
        relativePath: "raw/synthetic.json",
        bytes: rawBody.length
      };
    }
  };
  const request = {
    requestId: "detect-1",
    text: "检测文本",
    textHash: createHash("sha256").update("检测文本", "utf8").digest("hex"),
    canonicalizationVersion: "v1",
    credentialRef: "AI_CONTENT_DETECTOR_PRIMARY",
    transmissionApproved: true
  };

  const disconnected = await runDetection({
    request,
    store,
    client: { async submit() { throw new Error("network lost"); } },
    contract() { throw new Error("must not parse"); }
  });
  const drifted = await runDetection({
    request: { ...request, requestId: "detect-2" },
    store,
    client: {
      async submit() {
        return {
          status: "received",
          httpStatus: 200,
          rawBody: Buffer.from("{\"unexpected\":true}")
        };
      }
    },
    contract() { throw new Error("schema drift"); }
  });

  assert.equal(disconnected.status, "unknown");
  assert.equal(disconnected.reason, "provider-transport-error");
  assert.equal(drifted.status, "unknown");
  assert.equal(drifted.reason, "provider-contract-error");
  assert.deepEqual(rawBodies, ["{\"unexpected\":true}"]);
});

test("CF-038 backup bytes stay readable after the live database changes", async t => {
  const root = await sandbox(t);
  const store = await openWorkspace(root);
  t.after(async () => store.close());
  const before = await store.putObject(Buffer.from("before-backup"));
  const backupPath = path.join(root, "snapshot", "workspace.db");
  await backupWorkspaceDatabase(store.stateDir, backupPath);
  await store.putObject(Buffer.from("after-backup"));

  const backupDb = new DatabaseSync(backupPath, { readOnly: true });
  t.after(() => backupDb.close());
  const count = backupDb.prepare("SELECT COUNT(*) AS count FROM object_refs").get();
  assert.equal(Number(count?.count), 1);
  assert.equal(
    backupDb.prepare("SELECT sha256 FROM object_refs").get()?.sha256,
    before.sha256
  );
  assert.equal((await readFile(backupPath)).length > 0, true);
});
