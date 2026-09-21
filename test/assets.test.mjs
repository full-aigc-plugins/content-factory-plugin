import assert from "node:assert/strict";
import test from "node:test";

import {
  createAssetRecord,
  createVisualBrief,
  evaluateVisualStrategy
} from "../packages/core/src/content/assets.ts";

const png1x1 = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489",
  "hex"
);

test("CF-020 preserves supplied screenshot provenance and never relabels it as generated", () => {
  const asset = createAssetRecord({
    assetId: "asset-screen",
    declaredKind: "screenshot",
    bytes: png1x1,
    mimeType: "image/png",
    usageNote: "产品操作步骤的真实界面截图",
    rights: { basis: "user-provided", owner: "user" }
  });

  assert.equal(asset.kind, "screenshot");
  assert.equal(asset.generated, false);
  assert.equal(asset.integrity.status, "valid");
  assert.deepEqual(asset.dimensions, { width: 1, height: 1 });
});

test("CF-020 flags corrupt bytes, MIME mismatch, oversized dimensions and missing usage note", () => {
  const bad = createAssetRecord({
    assetId: "asset-bad",
    declaredKind: "user-image",
    bytes: Buffer.from("not-an-image"),
    mimeType: "image/png",
    usageNote: "",
    rights: { basis: "unknown" }
  });
  assert.ok(bad.risks.includes("invalid-image"));
  assert.ok(bad.risks.includes("missing-usage-note"));
  assert.ok(bad.risks.includes("unclear-rights"));

  const jpegDeclaredAsPng = createAssetRecord({
    assetId: "asset-mime",
    declaredKind: "user-image",
    bytes: Buffer.from("ffd8ffe000104a46494600", "hex"),
    mimeType: "image/png",
    usageNote: "用户提供的配图",
    rights: { basis: "user-provided", owner: "user" }
  });
  assert.ok(jpegDeclaredAsPng.risks.includes("mime-mismatch"));

  const hugePng = Buffer.from(png1x1);
  hugePng.writeUInt32BE(10000, 16);
  hugePng.writeUInt32BE(9000, 20);
  const oversized = createAssetRecord({
    assetId: "asset-large",
    declaredKind: "user-image",
    bytes: hugePng,
    mimeType: "image/png",
    usageNote: "大尺寸素材",
    rights: { basis: "licensed", license: "project-license" },
    limits: { maxWidth: 4096, maxHeight: 4096 }
  });
  assert.ok(oversized.risks.includes("dimensions-over-budget"));
});

test("CF-020 visual brief binds purpose and paragraph anchor without requiring image generation", () => {
  const brief = createVisualBrief({
    briefId: "visual-1",
    revisionId: "rev-42",
    anchor: "paragraph:7",
    purpose: "解释 Source → Claim → Review 的关系",
    assetKind: "diagram",
    aspectRatio: "16:9",
    textConstraints: ["不要虚构产品数据"],
    sourceRefs: ["s1", "s2"]
  });

  assert.equal(brief.anchor, "paragraph:7");
  assert.equal(brief.revisionId, "rev-42");
  assert.deepEqual(brief.sourceRefs, ["s1", "s2"]);
  assert.equal(brief.generationStatus, "not-requested");
});

test("CF-020 work draft may proceed without images while formal no-image completion must be explicit", () => {
  assert.deepEqual(
    evaluateVisualStrategy({ requiredBriefs: 2, fulfilledAssets: 0, explicitNoImage: false }),
    { workDraftAllowed: true, formalReady: false, reason: "visuals-pending" }
  );
  assert.deepEqual(
    evaluateVisualStrategy({ requiredBriefs: 2, fulfilledAssets: 0, explicitNoImage: true }),
    { workDraftAllowed: true, formalReady: true, reason: "explicit-no-image" }
  );
});
