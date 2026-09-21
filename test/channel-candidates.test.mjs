import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CHANNEL_CANDIDATES,
  assessChannelCandidate
} from "../adapters/channel-sources/candidate-bindings.ts";

function candidate(id) {
  const value = CHANNEL_CANDIDATES.find(item => item.id === id);
  assert.ok(value, id);
  return value;
}

test("CF-048 does not treat a Xiaohongshu MCP server as an executable skill wrapper", () => {
  const result = assessChannelCandidate(candidate("xiaohongshu-mcp-server"), {
    channelId: "xiaohongshu",
    formatId: "note",
    capability: "deliver"
  });
  assert.equal(result.eligible, false);
  assert.deepEqual(result.reasons, ["backend-requires-reviewed-wrapper", "contract-unverified"]);
});

test("CF-048 keeps acquisition, authoring, and delivery capabilities separate", () => {
  const search = candidate("wechat-article-search");
  assert.equal(assessChannelCandidate(search, {
    channelId: "wechat-article",
    formatId: "article",
    capability: "acquire"
  }).eligible, false, "historical source remains unverified");
  assert.deepEqual(assessChannelCandidate(search, {
    channelId: "wechat-article",
    formatId: "article",
    capability: "deliver"
  }).reasons, ["capability-mismatch", "contract-unverified"]);

  const shared = candidate("shared-social-authoring");
  assert.equal(assessChannelCandidate(shared, {
    channelId: "xiaohongshu",
    formatId: "note",
    capability: "author"
  }).eligible, true);
  assert.equal(assessChannelCandidate(shared, {
    channelId: "xiaohongshu",
    formatId: "note",
    capability: "deliver"
  }).eligible, false);
});

test("CF-048 rejects article, thought, answer, and video format conflation", () => {
  assert.deepEqual(assessChannelCandidate(candidate("zhihu-thought-publisher"), {
    channelId: "zhihu",
    formatId: "answer",
    capability: "deliver"
  }).reasons, ["format-mismatch", "contract-unverified"]);

  assert.deepEqual(assessChannelCandidate(candidate("wechat-account-article-adapter"), {
    channelId: "wechat-video",
    formatId: "video",
    capability: "deliver"
  }).reasons, ["channel-mismatch", "format-mismatch", "contract-unverified"]);
});

test("CF-048 review matrix names primary and alternate readiness without inventing live support", async () => {
  const report = JSON.parse(await readFile(
    "docs/verification/channel-candidates/reviewed-bindings.json",
    "utf8"
  ));
  assert.equal(report.live_catalog_retrieval, "NOT_RUN");
  assert.equal(report.live_delivery_support, "NOT_RUN");
  assert.equal(report.bindings["xiaohongshu:note:author"].primary, "shared-social-authoring");
  assert.equal(report.bindings["xiaohongshu:note:deliver"].primary, null);
  assert.ok(report.bindings["xiaohongshu:note:deliver"].alternates.includes("xiaohongshu-mcp-wrapper"));
  assert.equal(report.bindings["wechat-video:video:deliver"].primary, null);
});
