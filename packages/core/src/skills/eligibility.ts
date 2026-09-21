export type BindingContext = {
  capability: string;
  hostId: string;
  availableRuntimes: string[];
  channelId: string;
  formatId: string;
  locale: string;
  outputContract: string;
  action: string;
  grantedPermissions: string[];
  approvedDataRecipients: string[];
  maxCostUsd: number;
};

export type RuntimeBinding = {
  bindingId: string;
  skillId: string;
  priority: number;
  installed: boolean;
  integrityVerified: boolean;
  contractVerified: boolean;
  capabilities: string[];
  hostIds: string[];
  runtimes: string[];
  channelIds: string[];
  formatIds: string[];
  locales: string[];
  outputContracts: string[];
  allowedActions: string[];
  requiredPermissions: string[];
  dataRecipients: string[];
  estimatedCostUsd: number;
  contractPath: string;
  executionResources: string[];
};

export type IneligibilityReason =
  | "not-installed"
  | "integrity-unverified"
  | "contract-unverified"
  | "capability-mismatch"
  | "host-unsupported"
  | "runtime-unavailable"
  | "channel-mismatch"
  | "format-mismatch"
  | "locale-mismatch"
  | "output-contract-mismatch"
  | "action-not-allowed"
  | "permission-not-granted"
  | "data-recipient-not-approved"
  | "budget-exceeded";

function supports(values: string[], value: string): boolean {
  return values.includes("*") || values.includes(value);
}

export function evaluateBindingEligibility(
  binding: RuntimeBinding,
  context: BindingContext
): { eligible: boolean; reasons: IneligibilityReason[] } {
  const reasons: IneligibilityReason[] = [];
  if (!binding.installed) reasons.push("not-installed");
  if (!binding.integrityVerified) reasons.push("integrity-unverified");
  if (!binding.contractVerified) reasons.push("contract-unverified");
  if (!supports(binding.capabilities, context.capability)) reasons.push("capability-mismatch");
  if (!supports(binding.hostIds, context.hostId)) reasons.push("host-unsupported");
  if (!binding.runtimes.some(runtime => context.availableRuntimes.includes(runtime))) {
    reasons.push("runtime-unavailable");
  }
  if (!supports(binding.channelIds, context.channelId)) reasons.push("channel-mismatch");
  if (!supports(binding.formatIds, context.formatId)) reasons.push("format-mismatch");
  if (!supports(binding.locales, context.locale)) reasons.push("locale-mismatch");
  if (!supports(binding.outputContracts, context.outputContract)) {
    reasons.push("output-contract-mismatch");
  }
  if (!supports(binding.allowedActions, context.action)) reasons.push("action-not-allowed");
  if (binding.requiredPermissions.some(item => !context.grantedPermissions.includes(item))) {
    reasons.push("permission-not-granted");
  }
  if (binding.dataRecipients.some(item => !context.approvedDataRecipients.includes(item))) {
    reasons.push("data-recipient-not-approved");
  }
  if (binding.estimatedCostUsd > context.maxCostUsd) reasons.push("budget-exceeded");
  return { eligible: reasons.length === 0, reasons };
}
