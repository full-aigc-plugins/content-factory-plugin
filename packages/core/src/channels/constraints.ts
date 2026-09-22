type ConstraintTarget = {
  channelId: string;
  formatId: string;
  accountAlias: string;
  region: string;
  action: string;
};

type PlatformConstraint = {
  constraintId: string;
  kind: "platform-requirement" | "ranking-algorithm-claim";
  mandatory: boolean;
  value: Record<string, unknown>;
  sourceUrl: string;
  checkedAt: string;
  validUntil: string;
  scope: ConstraintTarget;
};

type ConstraintInput = {
  now: string;
  target: ConstraintTarget;
  constraints: PlatformConstraint[];
};

function hasExactScope(scope: ConstraintTarget, target: ConstraintTarget): boolean {
  return scope.channelId === target.channelId
    && scope.formatId === target.formatId
    && scope.accountAlias === target.accountAlias
    && scope.region === target.region
    && scope.action === target.action;
}

export function evaluatePlatformConstraints(input: ConstraintInput) {
  const now = Date.parse(input.now);
  const applicable: PlatformConstraint[] = [];
  const blockers: Array<{ constraintId: string; reason: string }> = [];
  const rejectedClaims: Array<{ constraintId: string; reason: string }> = [];

  for (const constraint of input.constraints) {
    if (!hasExactScope(constraint.scope, input.target)) continue;

    if (constraint.kind === "ranking-algorithm-claim") {
      rejectedClaims.push({
        constraintId: constraint.constraintId,
        reason: "unsupported-ranking-algorithm-claim"
      });
      if (constraint.mandatory) {
        blockers.push({
          constraintId: constraint.constraintId,
          reason: "unsupported-ranking-algorithm-claim"
        });
      }
      continue;
    }

    const checkedAt = Date.parse(constraint.checkedAt);
    const validUntil = Date.parse(constraint.validUntil);
    const sourced = constraint.sourceUrl.length > 0
      && Number.isFinite(checkedAt)
      && Number.isFinite(validUntil)
      && checkedAt <= now;

    if (!sourced) {
      if (constraint.mandatory) {
        blockers.push({ constraintId: constraint.constraintId, reason: "mandatory-constraint-unknown" });
      }
      continue;
    }

    if (validUntil < now) {
      if (constraint.mandatory) {
        blockers.push({ constraintId: constraint.constraintId, reason: "mandatory-constraint-expired" });
      }
      continue;
    }

    applicable.push(constraint);
  }

  return {
    status: blockers.length > 0 ? "blocked" as const : "ready" as const,
    applicable,
    blockers,
    rejectedClaims,
    remoteActionAllowed: blockers.length === 0,
    workingExportAllowed: true
  };
}
