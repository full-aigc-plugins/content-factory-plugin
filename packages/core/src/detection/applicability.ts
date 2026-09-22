import { createHash } from "node:crypto";

type ApplicabilityPolicy = {
  policyId: string;
  providerAlias: string;
  supportedLanguages: string[];
  supportedInputKinds: string[];
  minCharacters: number;
  maxCharacters: number;
  configuredThreshold: number | null;
};

type ExistingReport = {
  finalTextSha256: string;
  policyId: string;
};

type ApplicabilityInput = {
  policy: ApplicabilityPolicy;
  language: string;
  inputKind: string;
  finalText: string;
  existingReport: ExistingReport | null;
};

function textHash(text: string): string {
  return createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

export function evaluateDetectionApplicability(input: ApplicabilityInput) {
  const finalTextSha256 = textHash(input.finalText);
  const common = {
    finalTextSha256,
    reusableReport: false,
    threshold: input.policy.configuredThreshold
  };

  if (!input.policy.supportedLanguages.includes(input.language)) {
    return { status: "not_evaluable" as const, reason: "unsupported-language" as const, ...common };
  }

  if (!input.policy.supportedInputKinds.includes(input.inputKind)) {
    return { status: "not_evaluable" as const, reason: "unsupported-input-kind" as const, ...common };
  }

  const characterCount = Array.from(input.finalText).length;
  if (characterCount < input.policy.minCharacters) {
    return { status: "not_evaluable" as const, reason: "input-too-short" as const, ...common };
  }
  if (characterCount > input.policy.maxCharacters) {
    return { status: "not_evaluable" as const, reason: "input-too-long" as const, ...common };
  }

  if (input.existingReport !== null) {
    const samePolicy = input.existingReport.policyId === input.policy.policyId;
    const sameText = input.existingReport.finalTextSha256 === finalTextSha256;
    if (samePolicy && sameText) {
      return {
        status: "evaluable" as const,
        reason: "exact-report-binding" as const,
        ...common,
        reusableReport: true
      };
    }
    return {
      status: "evaluable" as const,
      reason: samePolicy ? "final-text-changed" as const : "policy-changed" as const,
      ...common
    };
  }

  return { status: "evaluable" as const, reason: "new-evaluation-required" as const, ...common };
}
