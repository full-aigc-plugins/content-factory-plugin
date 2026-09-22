import type { DraftVerification } from "./verify.ts";

export function planDraftUpdate(
  verification: DraftVerification
): { status: "not-required" | "new-approval-required" | "reconcile-first" } {
  if (verification.status === "verified") return { status: "not-required" };
  if (verification.status === "conflict") {
    return { status: "new-approval-required" };
  }
  return { status: "reconcile-first" };
}
