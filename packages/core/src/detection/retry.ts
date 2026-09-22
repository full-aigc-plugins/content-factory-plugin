import type { RequestBudget } from "../security/budgets.ts";

export type DetectionAttempt = {
  requestId: string;
  attempt: number;
  httpStatus: number | null;
  usageCost: number | null;
  outcome: "response" | "transport-unknown";
};

export type DetectionRetryResult = {
  requestId: string;
  status: "blocked" | "cancelled" | "failed" | "unknown" | "succeeded";
  reason: string | null;
  attempts: DetectionAttempt[];
  usage: {
    status: "known" | "unknown";
    knownCost: number;
  };
};

function money(value: number): number {
  return Number(value.toFixed(12));
}

export async function executeDetectionWithRetry(input: {
  requestId: string;
  maximumCost: number;
  budget: RequestBudget;
  isCancelled: () => boolean;
  sendAttempt: (attempt: number) => Promise<{
    httpStatus: number;
    usageCost: number | null;
    retryAfterMs?: number;
  }>;
  wait: (milliseconds: number) => Promise<void>;
}): Promise<DetectionRetryResult> {
  if (input.isCancelled()) {
    return {
      requestId: input.requestId,
      status: "cancelled",
      reason: "request-cancelled",
      attempts: [],
      usage: { status: "known", knownCost: 0 }
    };
  }
  const reservation = input.budget.reserve(input.maximumCost);
  if (reservation.status === "blocked") {
    return {
      requestId: input.requestId,
      status: "blocked",
      reason: reservation.reason,
      attempts: [],
      usage: { status: "known", knownCost: 0 }
    };
  }

  const attempts: DetectionAttempt[] = [];
  let knownCost = 0;
  let unknownCharge = false;
  const finish = (
    status: DetectionRetryResult["status"],
    reason: string | null
  ): DetectionRetryResult => {
    input.budget.settle({
      reservationId: reservation.reservationId,
      knownCost,
      unknownCharge
    });
    return {
      requestId: input.requestId,
      status,
      reason,
      attempts: attempts.map(item => ({ ...item })),
      usage: {
        status: unknownCharge ? "unknown" : "known",
        knownCost
      }
    };
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    try {
      response = await input.sendAttempt(attempt);
    } catch {
      unknownCharge = true;
      attempts.push({
        requestId: input.requestId,
        attempt,
        httpStatus: null,
        usageCost: null,
        outcome: "transport-unknown"
      });
      return finish("unknown", "transport-outcome-unknown");
    }

    if (response.usageCost === null) {
      unknownCharge = true;
    } else {
      knownCost = money(knownCost + response.usageCost);
    }
    attempts.push({
      requestId: input.requestId,
      attempt,
      httpStatus: response.httpStatus,
      usageCost: response.usageCost,
      outcome: "response"
    });

    if (response.httpStatus === 401) {
      return finish("failed", "authentication-failed");
    }
    if (response.httpStatus === 429) {
      if (input.isCancelled()) {
        return finish("cancelled", "request-cancelled");
      }
      if (attempt === 3) {
        return finish("failed", "rate-limit-retries-exhausted");
      }
      const retryAfterMs = Number.isFinite(response.retryAfterMs)
        ? Math.max(0, response.retryAfterMs ?? 0)
        : 0;
      await input.wait(retryAfterMs);
      continue;
    }
    if (response.httpStatus >= 200 && response.httpStatus < 300) {
      return finish("succeeded", null);
    }
    return finish("failed", "provider-http-failure");
  }

  return finish("failed", "retry-state-invalid");
}
