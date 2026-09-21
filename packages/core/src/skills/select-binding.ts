import {
  evaluateBindingEligibility,
  type BindingContext,
  type IneligibilityReason,
  type RuntimeBinding
} from "./eligibility.ts";

type Rejections = Record<string, IneligibilityReason[]>;

export type BindingSelection =
  | {
    status: "selected";
    primary: RuntimeBinding;
    rejections: Rejections;
    loadPlan: {
      selection: string[];
      execution: string[];
    };
  }
  | {
    status: "blocked";
    reason: "new-consent-required";
    candidateBindingId: string;
    consentChanges: {
      permissions: string[];
      dataRecipients: string[];
      additionalCostUsd: number;
    };
    rejections: Rejections;
  }
  | {
    status: "blocked";
    reason: "no-eligible-binding";
    rejections: Rejections;
  };

const CONSENT_REASONS = new Set<IneligibilityReason>([
  "permission-not-granted",
  "data-recipient-not-approved",
  "budget-exceeded"
]);

function byPreference(left: RuntimeBinding, right: RuntimeBinding): number {
  return right.priority - left.priority || left.bindingId.localeCompare(right.bindingId);
}

export function selectBinding(
  bindings: RuntimeBinding[],
  context: BindingContext
): BindingSelection {
  const assessments = bindings.map(binding => ({
    binding,
    assessment: evaluateBindingEligibility(binding, context)
  }));
  const rejections: Rejections = Object.fromEntries(
    assessments
      .filter(item => !item.assessment.eligible)
      .map(item => [item.binding.bindingId, item.assessment.reasons])
  );
  const eligible = assessments
    .filter(item => item.assessment.eligible)
    .map(item => item.binding)
    .sort(byPreference);
  const primary = eligible[0];
  if (primary) {
    return {
      status: "selected",
      primary,
      rejections,
      loadPlan: {
        selection: bindings.map(item => `binding:${item.bindingId}`),
        execution: [primary.contractPath, ...primary.executionResources]
      }
    };
  }

  const consentCandidate = assessments
    .filter(item => item.assessment.reasons.length > 0
      && item.assessment.reasons.every(reason => CONSENT_REASONS.has(reason)))
    .map(item => item.binding)
    .sort(byPreference)[0];
  if (consentCandidate) {
    return {
      status: "blocked",
      reason: "new-consent-required",
      candidateBindingId: consentCandidate.bindingId,
      consentChanges: {
        permissions: consentCandidate.requiredPermissions
          .filter(item => !context.grantedPermissions.includes(item)),
        dataRecipients: consentCandidate.dataRecipients
          .filter(item => !context.approvedDataRecipients.includes(item)),
        additionalCostUsd: Math.max(0, consentCandidate.estimatedCostUsd - context.maxCostUsd)
      },
      rejections
    };
  }

  return { status: "blocked", reason: "no-eligible-binding", rejections };
}
