import { ContentFactoryError } from "../errors.ts";

export type SourceOrigin = "external" | "user";
export type SourceAccessStatus = "read" | "unread";

export type ClaimSource = {
  sourceId: string;
  origin: SourceOrigin;
  accessStatus: SourceAccessStatus;
  locator: {
    kind: string;
    value: string;
  };
  sourcePermission: string;
  deliveryExcerptAllowed: boolean;
};

export type SourceBundle = {
  sources: ClaimSource[];
  sourceIds: string[];
};

export type ClaimEvidence = {
  sourceId: string;
  locator: string;
};

export type ClaimKind = "verifiable" | "user_assertion";
export type ClaimVerification = "source-backed" | "user-asserted";

export type ClaimInput = {
  claimId: string;
  statement: string;
  kind: ClaimKind;
  evidence: ClaimEvidence[];
  conflictGroup?: string;
};

export type ClaimRecord = ClaimInput & {
  verification: ClaimVerification;
  independentlyPublicVerified: boolean;
};

export type ClaimConflict = {
  conflictGroup: string;
  claimIds: string[];
};

export type ClaimRegistry = {
  mode: "search-assisted" | "materials-only";
  claims: ClaimRecord[];
  conflicts: ClaimConflict[];
};

export function createSourceBundle(sources: ClaimSource[]): SourceBundle {
  const seen = new Set<string>();
  const copied = sources.map(source => {
    if (!source.sourceId.trim()) {
      throw new ContentFactoryError({
        code: "SOURCE_ID_REQUIRED",
        message: "claim source requires a source id",
        retryable: false
      });
    }
    if (seen.has(source.sourceId)) {
      throw new ContentFactoryError({
        code: "SOURCE_ID_DUPLICATE",
        message: "claim source ids must be unique",
        retryable: false,
        details: { sourceId: source.sourceId }
      });
    }
    seen.add(source.sourceId);
    return {
      ...source,
      locator: { ...source.locator }
    };
  });

  return {
    sources: copied,
    sourceIds: copied.map(source => source.sourceId)
  };
}

export function createClaimRegistry(input: {
  sourceBundle: SourceBundle;
  searchAvailable: boolean;
  claims: ClaimInput[];
}): ClaimRegistry {
  const sourceMap = new Map(
    input.sourceBundle.sources.map(source => [source.sourceId, source] as const)
  );
  const claimIds = new Set<string>();

  const claims = input.claims.map(claim => {
    if (!claim.claimId.trim()) {
      throw new ContentFactoryError({
        code: "CLAIM_ID_REQUIRED",
        message: "claim requires an id",
        retryable: false
      });
    }
    if (claimIds.has(claim.claimId)) {
      throw new ContentFactoryError({
        code: "CLAIM_ID_DUPLICATE",
        message: "claim ids must be unique",
        retryable: false,
        details: { claimId: claim.claimId }
      });
    }
    claimIds.add(claim.claimId);

    if (claim.kind === "verifiable" && claim.evidence.length === 0) {
      throw new ContentFactoryError({
        code: "CLAIM_EVIDENCE_REQUIRED",
        message: "verifiable claims require source evidence",
        retryable: false,
        details: { claimId: claim.claimId }
      });
    }

    const evidenceSources = claim.evidence.map(evidence => {
      const source = sourceMap.get(evidence.sourceId);
      if (!source) {
        throw new ContentFactoryError({
          code: "CLAIM_SOURCE_NOT_FOUND",
          message: "claim references a source outside the source bundle",
          retryable: false,
          details: { claimId: claim.claimId, sourceId: evidence.sourceId }
        });
      }
      if (source.accessStatus !== "read") {
        throw new ContentFactoryError({
          code: "CLAIM_SOURCE_UNREAD",
          message: "claim evidence must reference a source that was actually read",
          retryable: false,
          details: { claimId: claim.claimId, sourceId: evidence.sourceId }
        });
      }
      return source;
    });

    const verification: ClaimVerification =
      claim.kind === "user_assertion" ? "user-asserted" : "source-backed";
    const independentlyPublicVerified =
      claim.kind === "verifiable"
      && evidenceSources.length > 0
      && evidenceSources.every(source => source.origin === "external");

    return {
      ...claim,
      evidence: claim.evidence.map(item => ({ ...item })),
      verification,
      independentlyPublicVerified
    };
  });

  const grouped = new Map<string, string[]>();
  for (const claim of claims) {
    const key = claim.conflictGroup?.trim();
    if (!key) continue;
    const values = grouped.get(key) ?? [];
    values.push(claim.claimId);
    grouped.set(key, values);
  }

  const conflicts = [...grouped.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([conflictGroup, ids]) => ({
      conflictGroup,
      claimIds: [...ids].sort((a, b) => a.localeCompare(b))
    }));

  return {
    mode: input.searchAvailable ? "search-assisted" : "materials-only",
    claims,
    conflicts
  };
}
