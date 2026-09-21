import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { probeZhuqueContract } from "../../src/external/zhuque.js";

test("Zhuque probe blocks before network when token is missing", async () => {
  let calls = 0;
  const result = await probeZhuqueContract({
    token: "",
    text: "中文🙂",
    fetch: async () => {
      calls++;
      throw new Error("must not call network");
    }
  });

  assert.equal(calls, 0);
  assert.equal(result.requestStatus, "blocked");
  assert.match(result.error!, /token/i);
});

test("Zhuque probe binds evidence to exact UTF-8 submitted text", async () => {
  const text = "中文🙂\nA";
  let seenBody = "";
  let seenAuthorization = "";

  const result = await probeZhuqueContract({
    token: "secret-token",
    text,
    checkedAt: "2026-09-21T00:00:00.000Z",
    fetch: async (_url, init) => {
      seenAuthorization = String(init?.headers?.Authorization ?? "");
      seenBody = String(init?.body ?? "");
      return {
        ok: true,
        status: 200,
        json: async () => ({ score: 0.42, segments: [] }),
        text: async () => ""
      };
    }
  });

  const expected = createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
  assert.equal(result.requestStatus, "succeeded");
  assert.equal(result.submittedSha256, expected);
  assert.equal(result.submittedBytes, Buffer.byteLength(text, "utf8"));
  assert.equal(seenAuthorization, "Bearer secret-token");
  assert.deepEqual(JSON.parse(seenBody), { text });
  assert.deepEqual(result.rawResponse, { score: 0.42, segments: [] });
});

test("Zhuque probe records non-2xx response without inventing detector semantics", async () => {
  const result = await probeZhuqueContract({
    token: "secret-token",
    text: "hello",
    fetch: async () => ({
      ok: false,
      status: 429,
      json: async () => ({ message: "quota" }),
      text: async () => "quota"
    })
  });

  assert.equal(result.requestStatus, "failed");
  assert.equal(result.httpStatus, 429);
  assert.match(result.error!, /429/);
  assert.equal(result.normalized, undefined);
});
