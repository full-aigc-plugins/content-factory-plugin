import assert from "node:assert/strict";
import test from "node:test";
import {
  createVisualBrief,
  invokeImageFactory,
  type ImageFactoryClient
} from "../../src/external/image-factory.js";

test("VisualBrief binds visual request to content revision and anchor", () => {
  const brief = createVisualBrief({
    contentId: "content-1",
    revisionId: "rev-7",
    anchor: "paragraph:3",
    purpose: "article-illustration",
    assetKind: "illustration",
    aspectRatio: "16:9",
    prompt: "Explain the architecture visually",
    sourceRefs: ["source-2"],
    textConstraints: ["no invented metrics"]
  });

  assert.equal(brief.contentId, "content-1");
  assert.equal(brief.revisionId, "rev-7");
  assert.equal(brief.anchor, "paragraph:3");
  assert.deepEqual(brief.sourceRefs, ["source-2"]);
});

test("unavailable Image Factory stops before run", async () => {
  let runCalls = 0;
  const client: ImageFactoryClient = {
    probe: async () => ({ available: false, evidence: { reason: "not installed" } }),
    run: async () => {
      runCalls++;
      throw new Error("must not run");
    }
  };

  const result = await invokeImageFactory({
    brief: createVisualBrief({
      contentId: "c",
      revisionId: "r",
      anchor: "cover",
      purpose: "cover",
      assetKind: "cover",
      prompt: "cover"
    }),
    approved: true,
    client
  });

  assert.equal(runCalls, 0);
  assert.equal(result.status, "unavailable");
});

test("unapproved visual generation never calls run", async () => {
  let runCalls = 0;
  const client: ImageFactoryClient = {
    probe: async () => ({ available: true, evidence: { cli: "bin/image-factory" } }),
    run: async () => {
      runCalls++;
      return { receipt: {} };
    }
  };

  const result = await invokeImageFactory({
    brief: createVisualBrief({
      contentId: "c",
      revisionId: "r",
      anchor: "cover",
      purpose: "cover",
      assetKind: "cover",
      prompt: "cover"
    }),
    approved: false,
    client
  });

  assert.equal(runCalls, 0);
  assert.equal(result.status, "approval_required");
});

test("successful Factory run preserves actual receipt evidence", async () => {
  const client: ImageFactoryClient = {
    probe: async () => ({
      available: true,
      evidence: { cli: "bin/image-factory", selectedSkill: "image-factory-use" }
    }),
    run: async (brief: { revisionId: string }) => ({
      receipt: {
        receiptId: "receipt-1",
        artifactPath: "/artifacts/cover.png",
        artifactSha256: "a".repeat(64),
        backend: "codex-imagegen"
      },
      raw: { run_id: "run-1", revision: brief.revisionId }
    })
  };

  const result = await invokeImageFactory({
    brief: createVisualBrief({
      contentId: "c",
      revisionId: "r",
      anchor: "cover",
      purpose: "cover",
      assetKind: "cover",
      prompt: "cover"
    }),
    approved: true,
    client
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.receipt?.receiptId, "receipt-1");
  assert.equal(result.receipt?.artifactSha256, "a".repeat(64));
  assert.deepEqual(result.raw, { run_id: "run-1", revision: "r" });
});

test("missing artifact digest keeps Factory result unverified", async () => {
  const client: ImageFactoryClient = {
    probe: async () => ({ available: true, evidence: {} }),
    run: async () => ({
      receipt: {
        receiptId: "receipt-2",
        artifactPath: "/artifacts/cover.png"
      }
    })
  };

  const result = await invokeImageFactory({
    brief: createVisualBrief({
      contentId: "c",
      revisionId: "r",
      anchor: "cover",
      purpose: "cover",
      assetKind: "cover",
      prompt: "cover"
    }),
    approved: true,
    client
  });

  assert.equal(result.status, "invalid_receipt");
  assert.match(result.error!, /sha256/i);
});
