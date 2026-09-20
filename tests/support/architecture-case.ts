export type CaseSpec = {
  id: string;
  given: string;
  when: string;
  then: string;
  negative: string;
};

export type CaseOutcome = {
  outputSchemaValid: boolean;
  invariantChecks: Record<string, boolean>;
  externalCalls: number;
  unauthorizedWrites: number;
};

export type CaseRunner = (spec: CaseSpec) => Promise<CaseOutcome>;

export function assertCaseOutcome(outcome: CaseOutcome): void {
  if (!outcome.outputSchemaValid) throw new Error("output schema invalid");
  const failed = Object.entries(outcome.invariantChecks).filter(([, ok]) => !ok);
  if (failed.length) throw new Error("invariant failed: " + failed.map(([name]) => name).join(", "));
  if (outcome.unauthorizedWrites !== 0) throw new Error("unauthorized write detected");
}
