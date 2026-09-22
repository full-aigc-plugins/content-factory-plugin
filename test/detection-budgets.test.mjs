import assert from "node:assert/strict";
import test from "node:test";

import { RequestBudget } from "../packages/core/src/security/budgets.ts";
import { executeDetectionWithRetry } from "../packages/core/src/detection/retry.ts";

test("CF-029 insufficient budget blocks before the first request", async () => {
  const budget = new RequestBudget({ limit: 1, currency: "CNY" });
  let calls = 0;
  const result = await executeDetectionWithRetry({
    requestId: "detect-budget",
    maximumCost: 2,
    budget,
    isCancelled: () => false,
    async sendAttempt() {
      calls += 1;
      return { httpStatus: 200, usageCost: 0.2 };
    },
    async wait() {}
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "budget-insufficient");
  assert.equal(calls, 0);
  assert.deepEqual(result.attempts, []);
});

test("CF-029 retries HTTP 429 at most twice and records every charged attempt", async () => {
  const budget = new RequestBudget({ limit: 5, currency: "CNY" });
  const responses = [
    { httpStatus: 429, usageCost: 0.1, retryAfterMs: 20 },
    { httpStatus: 429, usageCost: 0.1, retryAfterMs: 40 },
    { httpStatus: 200, usageCost: 0.2 }
  ];
  const waits = [];
  const result = await executeDetectionWithRetry({
    requestId: "detect-rate-limit",
    maximumCost: 1,
    budget,
    isCancelled: () => false,
    async sendAttempt() { return responses.shift(); },
    async wait(milliseconds) { waits.push(milliseconds); }
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.requestId, "detect-rate-limit");
  assert.equal(result.attempts.every(item => item.requestId === result.requestId), true);
  assert.deepEqual(result.attempts.map(item => item.httpStatus), [429, 429, 200]);
  assert.deepEqual(result.attempts.map(item => item.usageCost), [0.1, 0.1, 0.2]);
  assert.deepEqual(waits, [20, 40]);
  assert.equal(result.usage.status, "known");
  assert.equal(result.usage.knownCost, 0.4);
  assert.equal(budget.snapshot().used, 0.4);
  assert.equal(budget.snapshot().reserved, 0);
});

test("CF-029 HTTP 401 is never retried", async () => {
  const budget = new RequestBudget({ limit: 5, currency: "CNY" });
  let calls = 0;
  const result = await executeDetectionWithRetry({
    requestId: "detect-auth",
    maximumCost: 1,
    budget,
    isCancelled: () => false,
    async sendAttempt() {
      calls += 1;
      return { httpStatus: 401, usageCost: 0 };
    },
    async wait() { throw new Error("must not wait"); }
  });

  assert.equal(result.status, "failed");
  assert.equal(result.reason, "authentication-failed");
  assert.equal(calls, 1);
});

test("CF-029 cancellation prevents a new retry and preserves incurred cost", async () => {
  const budget = new RequestBudget({ limit: 5, currency: "CNY" });
  let cancelled = false;
  let calls = 0;
  const result = await executeDetectionWithRetry({
    requestId: "detect-cancel",
    maximumCost: 1,
    budget,
    isCancelled: () => cancelled,
    async sendAttempt() {
      calls += 1;
      cancelled = true;
      return { httpStatus: 429, usageCost: 0.25, retryAfterMs: 10 };
    },
    async wait() { throw new Error("must not wait after cancellation"); }
  });

  assert.equal(result.status, "cancelled");
  assert.equal(calls, 1);
  assert.equal(result.usage.knownCost, 0.25);
  assert.equal(budget.snapshot().used, 0.25);
  assert.equal(budget.snapshot().reserved, 0);
});

test("CF-029 unknown network usage is recorded as unknown, never zero", async () => {
  const budget = new RequestBudget({ limit: 5, currency: "CNY" });
  const result = await executeDetectionWithRetry({
    requestId: "detect-unknown-cost",
    maximumCost: 1,
    budget,
    isCancelled: () => false,
    async sendAttempt() {
      throw new Error("response lost after possible provider acceptance");
    },
    async wait() {}
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.usage.status, "unknown");
  assert.equal(result.usage.knownCost, 0);
  assert.equal(result.attempts[0].usageCost, null);
  assert.equal(budget.snapshot().unknownCharges, 1);
  assert.equal(budget.snapshot().availableKnown, false);
});
