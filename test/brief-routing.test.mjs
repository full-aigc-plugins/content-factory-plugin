import assert from "node:assert/strict";
import test from "node:test";

import { dispatchContentRequest } from "../packages/core/src/application/dispatch.ts";

test("CF-013 format mode contains no research rewrite detection or delivery stages", () => {
  const plan = dispatchContentRequest({
    mode: "format",
    contentRef: "rev_123",
    channel: "wechat-article"
  });
  assert.deepEqual(plan.stages.map(stage => stage.stageId), ["format", "review"]);
  for (const forbidden of ["research", "write", "edit", "detect", "deliver"]) {
    assert.equal(plan.stages.some(stage => stage.stageId === forbidden), false);
  }
  assert.deepEqual(plan.brief.missingInputs, []);
});

test("CF-013 deliver mode requires preflight approval delivery and verification in order", () => {
  const plan = dispatchContentRequest({
    mode: "deliver",
    contentRef: "rev_ready",
    channel: "wechat-article",
    accountRef: "acct_wechat_primary"
  });
  assert.deepEqual(
    plan.stages.map(stage => stage.stageId),
    ["delivery-preflight", "approval", "deliver", "delivery-verify"]
  );
  assert.equal(plan.brief.channel, "wechat-article");
  assert.equal(plan.brief.accountRef, "acct_wechat_primary");
});

test("CF-013 preserves known request context and reports missing facts instead of inventing them", () => {
  const known = dispatchContentRequest({
    mode: "full",
    topic: "Content Factory architecture",
    channel: "juejin",
    locale: "zh-CN",
    audience: "Java/Rust engineers",
    goal: "technical tutorial"
  });
  assert.equal(known.brief.topic, "Content Factory architecture");
  assert.equal(known.brief.audience, "Java/Rust engineers");
  assert.equal(known.brief.goal, "technical tutorial");
  assert.deepEqual(known.brief.missingInputs, []);

  const missing = dispatchContentRequest({ mode: "full" });
  assert.equal(missing.brief.topic, null);
  assert.ok(missing.brief.missingInputs.includes("topic_or_source"));
  assert.equal(missing.brief.assumptions.length, 0);
});

test("CF-013 routes edit detect and repurpose through bounded mode-specific DAGs", () => {
  const edit = dispatchContentRequest({ mode: "edit", contentRef: "rev_a" });
  assert.deepEqual(edit.stages.map(stage => stage.stageId), ["edit", "fact-check", "review"]);

  const detect = dispatchContentRequest({ mode: "detect", contentRef: "rev_a" });
  assert.deepEqual(detect.stages.map(stage => stage.stageId), ["detect", "review"]);

  const repurpose = dispatchContentRequest({
    mode: "repurpose",
    contentRef: "rev_a",
    channel: "x"
  });
  assert.deepEqual(
    repurpose.stages.map(stage => stage.stageId),
    ["repurpose", "fact-check", "format", "review"]
  );
});
