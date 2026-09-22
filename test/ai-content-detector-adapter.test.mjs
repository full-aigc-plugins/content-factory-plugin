import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createAiContentDetectorClient } from "../adapters/zhuque/client.ts";
import { WorkspaceDetectionStore } from "../packages/core/src/detection/store.ts";
import { runDetection } from "../packages/core/src/detection/zhuque.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";

const visibleText = "标题\n\n正文🙂";
const textHash = "251555ec89a8c1d80e9c2c65d982ea515252014f8d620c705d20907c6cec6e89";

function request(overrides = {}) {
  return {
    requestId: "detect-001",
    text: visibleText,
    textHash,
    canonicalizationVersion: "1",
    credentialRef: "AI_CONTENT_DETECTOR_PRIMARY",
    transmissionApproved: true,
    ...overrides
  };
}

function syntheticContract(rawBody) {
  const value = JSON.parse(Buffer.from(rawBody).toString("utf8"));
  if (typeof value !== "object" || value === null
      || typeof value.business_status !== "string") {
    throw new Error("synthetic contract missing business_status");
  }
  if (value.business_status !== "ok") {
    return { status: "business-failure", reason: value.business_status };
  }
  if (typeof value.request_id !== "string") {
    throw new Error("synthetic contract missing request_id");
  }
  return { status: "succeeded", providerRequestId: value.request_id };
}

async function workspaceStore(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-detection-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const workspace = await openWorkspace(root);
  t.after(async () => workspace.close());
  return new WorkspaceDetectionStore(workspace);
}

test("CF-025 does not resolve a secret or send text without transmission approval", async () => {
  let secretCalls = 0;
  let transportCalls = 0;
  const client = createAiContentDetectorClient({
    secretProvider: {
      async resolve() {
        secretCalls += 1;
        return "must-not-be-read";
      }
    },
    transport: {
      async send() {
        transportCalls += 1;
        throw new Error("must not send");
      }
    }
  });

  const result = await runDetection({
    request: request({ transmissionApproved: false }),
    client,
    store: { async putRaw() { throw new Error("must not store"); } },
    contract: syntheticContract
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "external-transmission-not-approved");
  assert.equal(secretCalls, 0);
  assert.equal(transportCalls, 0);
  assert.equal(result.rawResponse, null);
});

test("CF-025 blocks missing credentials without calling the transport", async () => {
  let transportCalls = 0;
  const client = createAiContentDetectorClient({
    secretProvider: { async resolve() { return null; } },
    transport: {
      async send() {
        transportCalls += 1;
        throw new Error("must not send");
      }
    }
  });

  const result = await runDetection({
    request: request(),
    client,
    store: { async putRaw() { throw new Error("must not store"); } },
    contract: syntheticContract
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "credential-unavailable");
  assert.equal(transportCalls, 0);
  assert.equal(result.rawResponse, null);
});

test("CF-025 binds exact UTF-8 text to an immutable raw response before success", async t => {
  const store = await workspaceStore(t);
  const rawBody = Buffer.from(JSON.stringify({
    business_status: "ok",
    request_id: "provider-request-7",
    unknown_future_field: { retained: true }
  }));
  let transmittedText;
  const client = createAiContentDetectorClient({
    secretProvider: { async resolve() { return "secret-value"; } },
    transport: {
      async send(input) {
        transmittedText = Buffer.from(input.textBytes);
        assert.equal(input.secret, "secret-value");
        return { httpStatus: 200, rawBody };
      }
    }
  });

  const result = await runDetection({
    request: request(), client, store, contract: syntheticContract,
    now: () => "2026-09-22T10:00:00.000Z"
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.textHash, textHash);
  assert.equal(result.providerRequestId, "provider-request-7");
  assert.deepEqual(transmittedText, Buffer.from(visibleText, "utf8"));
  assert.equal(result.rawResponse?.bytes, rawBody.length);
  assert.deepEqual(
    await readFile(result.rawResponse.absolutePath),
    rawBody
  );
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});

test("CF-025 never treats HTTP 200 with business failure as succeeded", async t => {
  const store = await workspaceStore(t);
  const rawBody = Buffer.from(JSON.stringify({
    business_status: "quota_rejected",
    provider_detail: "synthetic fixture"
  }));
  const client = createAiContentDetectorClient({
    secretProvider: { async resolve() { return "secret-value"; } },
    transport: { async send() { return { httpStatus: 200, rawBody }; } }
  });

  const result = await runDetection({
    request: request(), client, store, contract: syntheticContract
  });

  assert.equal(result.status, "failed");
  assert.equal(result.reason, "provider-business-failure");
  assert.equal(result.rawResponse?.bytes, rawBody.length);
});

test("CF-025 preserves schema-drift evidence and returns unknown contract status", async t => {
  const store = await workspaceStore(t);
  const rawBody = Buffer.from(JSON.stringify({
    renamed_status: "ok",
    future_payload: [1, 2, 3]
  }));
  const client = createAiContentDetectorClient({
    secretProvider: { async resolve() { return "secret-value"; } },
    transport: { async send() { return { httpStatus: 200, rawBody }; } }
  });

  const result = await runDetection({
    request: request(), client, store, contract: syntheticContract
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "provider-contract-error");
  assert.deepEqual(await readFile(result.rawResponse.absolutePath), rawBody);
});
