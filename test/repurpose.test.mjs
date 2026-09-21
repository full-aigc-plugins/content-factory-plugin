import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptRepurposedCandidate,
  createRepurposeRequest
} from "../adapters/content-methods/repurpose.ts";

const parent = {
  contentItemId: "article-1",
  revisionId: "rev-1",
  text: "Content Factory 覆盖 16 个渠道，基线运行时是 Node.js 24。",
  detectionReportId: "det-parent",
  approvalId: "approval-parent"
};

const claims = {
  mode: "materials-only",
  conflicts: [],
  claims: [{
    claimId: "c1",
    statement: "Content Factory covers 16 channels.",
    kind: "verifiable",
    evidence: [{ sourceId: "s1", locator: "architecture:channels" }],
    verification: "source-backed",
    independentlyPublicVerified: true
  }]
};

test("CF-019 creates a new child item with lineage and no inherited detection or approval", () => {
  const request = createRepurposeRequest({
    parent,
    claimRegistry: claims,
    target: { channel: "x", format: "post" }
  });

  assert.notEqual(request.child.contentItemId, parent.contentItemId);
  assert.deepEqual(request.child.lineage, {
    parentContentItemId: "article-1",
    parentRevisionId: "rev-1"
  });
  assert.equal(request.child.detectionReportId, null);
  assert.equal(request.child.approvalId, null);
  assert.equal(request.child.reviewRequired, true);
});

test("CF-019 does not mutate or overwrite the parent article", () => {
  const snapshot = structuredClone(parent);
  const request = createRepurposeRequest({
    parent,
    claimRegistry: claims,
    target: { channel: "weibo", format: "post" }
  });
  acceptRepurposedCandidate(request, {
    text: "Content Factory 覆盖 16 个渠道。",
    vendorMethod: "social"
  });

  assert.deepEqual(parent, snapshot);
});

test("CF-019 shortening may omit facts but cannot introduce a contradictory new number", () => {
  const request = createRepurposeRequest({
    parent,
    claimRegistry: claims,
    target: { channel: "x", format: "post" }
  });

  const concise = acceptRepurposedCandidate(request, {
    text: "Content Factory 是一个多渠道内容生产体系。",
    vendorMethod: "social"
  });
  assert.equal(concise.status, "review-required");

  assert.throws(
    () => acceptRepurposedCandidate(request, {
      text: "Content Factory 覆盖 60 个渠道。",
      vendorMethod: "social"
    }),
    error => error?.code === "REPURPOSE_UNSUPPORTED_NUMBER"
  );
});

test("CF-019 video-script derivative exposes a media-factory handoff without claiming a finished video", () => {
  const request = createRepurposeRequest({
    parent,
    claimRegistry: claims,
    target: { channel: "douyin", format: "video-script" }
  });
  const result = acceptRepurposedCandidate(request, {
    text: "口播：Content Factory 覆盖 16 个渠道。",
    vendorMethod: "social"
  });

  assert.deepEqual(result.mediaHandoff, {
    kind: "video-script",
    status: "script-only",
    contentItemId: request.child.contentItemId
  });
});
