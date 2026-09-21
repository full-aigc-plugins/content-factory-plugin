import assert from "node:assert/strict";
import test from "node:test";
import {
  createWechatDraft,
  readWechatDraft,
  type WechatDraftTransport
} from "../../src/external/wechat-draft.js";

test("missing credential blocks WeChat mutation before network", async () => {
  let calls = 0;
  const transport: WechatDraftTransport = {
    request: async () => {
      calls++;
      throw new Error("must not call");
    }
  };

  const result = await createWechatDraft({
    accessToken: "",
    bundleHash: "bundle-1",
    articles: [{ title: "A", content: "<p>x</p>" }],
    transport
  });

  assert.equal(calls, 0);
  assert.equal(result.status, "blocked");
  assert.match(result.error!, /access token/i);
});

test("successful draft create records remote id but remains unverified", async () => {
  const transport: WechatDraftTransport = {
    request: async (request) => {
      assert.equal(request.method, "POST");
      assert.match(request.url, /draft\/add/);
      assert.match(request.url, /access_token=token/);
      return {
        status: 200,
        body: { media_id: "remote-draft-1" }
      };
    }
  };

  const result = await createWechatDraft({
    accessToken: "token",
    bundleHash: "bundle-1",
    articles: [{ title: "A", content: "<p>x</p>" }],
    transport
  });

  assert.equal(result.status, "submitted_unverified");
  assert.equal(result.remoteId, "remote-draft-1");
  assert.equal(result.bundleHash, "bundle-1");
});

test("ambiguous transport failure becomes unknown and never retries blindly", async () => {
  let attempts = 0;
  const transport: WechatDraftTransport = {
    request: async () => {
      attempts++;
      throw new Error("socket closed after write");
    }
  };

  const result = await createWechatDraft({
    accessToken: "token",
    bundleHash: "bundle-2",
    articles: [{ title: "A", content: "<p>x</p>" }],
    transport
  });

  assert.equal(attempts, 1);
  assert.equal(result.status, "unknown");
  assert.match(result.error!, /socket closed/);
});

test("readback returns remote content evidence independently from create", async () => {
  const transport: WechatDraftTransport = {
    request: async (request) => {
      assert.equal(request.method, "POST");
      assert.match(request.url, /draft\/get/);
      assert.deepEqual(request.body, { media_id: "remote-draft-1" });
      return {
        status: 200,
        body: {
          news_item: [{ title: "A", content: "<p>x</p>" }]
        }
      };
    }
  };

  const result = await readWechatDraft({
    accessToken: "token",
    remoteId: "remote-draft-1",
    transport
  });

  assert.equal(result.status, "read");
  assert.equal(result.remoteId, "remote-draft-1");
  assert.deepEqual(result.rawResponse, {
    news_item: [{ title: "A", content: "<p>x</p>" }]
  });
});

test("WeChat application error is failed, not submitted", async () => {
  const transport: WechatDraftTransport = {
    request: async () => ({
      status: 200,
      body: { errcode: 40001, errmsg: "invalid credential" }
    })
  };

  const result = await createWechatDraft({
    accessToken: "token",
    bundleHash: "bundle-3",
    articles: [{ title: "A", content: "<p>x</p>" }],
    transport
  });

  assert.equal(result.status, "failed");
  assert.match(result.error!, /40001/);
});
