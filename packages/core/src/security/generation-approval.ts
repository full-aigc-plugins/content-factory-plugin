export type GenerationCapability = {
  status: "available" | "unavailable" | "unknown";
};

export type GenerationApproval = {
  approved: boolean;
  budgetRef: string | null;
};

export type GenerationAuthorization =
  | { allowed: true; budgetRef: string }
  | { allowed: false; reason: "image-factory-unavailable" | "generation-approval-required" };

export function authorizeGeneration(
  capability: GenerationCapability,
  approval: GenerationApproval
): GenerationAuthorization {
  if (capability.status !== "available") {
    return { allowed: false, reason: "image-factory-unavailable" };
  }
  if (!approval.approved || approval.budgetRef === null || approval.budgetRef.trim() === "") {
    return { allowed: false, reason: "generation-approval-required" };
  }
  return { allowed: true, budgetRef: approval.budgetRef };
}
