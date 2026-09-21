export type CandidateStatus =
  | "discovered"
  | "source_reviewed"
  | "candidate_approved"
  | "locked"
  | "installed"
  | "contract_verified"
  | "live_verified";

export type CandidateRecord = {
  displayName: string;
  namespace: string;
  owner: string | null;
  slug: string | null;
  canonicalIdentity: string | null;
  observedVersion: string | null;
  observedAt: string;
  evidenceTier: "indexed-snapshot" | "live-detail" | "live-category" | "package-bytes";
  retrievalLimits: string[];
  discoveryCoverage: "partial" | "complete";
  latestRankingVerified: boolean;
  catalogScore: number | null;
  license: string | null;
  status: CandidateStatus;
  executable: boolean;
};

export type CandidateCapability =
  | "acquire"
  | "author"
  | "edit"
  | "format"
  | "quality-review"
  | "media-generation"
  | "deliver";

export type CandidateClaim =
  | "natural-voice"
  | "detector-evasion"
  | "traffic-guarantee"
  | "automatic-publish";

export type CandidateUseAssessment = {
  disposition: "candidate-only" | "external-owner" | "rejected" | "eligible";
  capabilityOwner: "content-factory" | "image-factory";
  allowedClaims: CandidateClaim[];
  rejectedClaims: CandidateClaim[];
  reasons: string[];
};

export function createCandidateRecord(input: Omit<
  CandidateRecord,
  | "canonicalIdentity"
  | "discoveryCoverage"
  | "latestRankingVerified"
  | "status"
  | "executable"
>): CandidateRecord {
  const canonicalIdentity = input.owner !== null && input.slug !== null
    ? `${input.namespace}/${input.owner}/${input.slug}`
    : null;
  return {
    ...input,
    canonicalIdentity,
    retrievalLimits: [...input.retrievalLimits],
    discoveryCoverage: input.retrievalLimits.length === 0 ? "complete" : "partial",
    latestRankingVerified: input.evidenceTier === "live-category"
      && input.retrievalLimits.length === 0,
    status: "discovered",
    executable: false
  };
}

export function advanceCandidate(
  record: CandidateRecord,
  target: "locked",
  evidence: {
    sourceUrl: string | null;
    immutableRef: string | null;
    commit: string | null;
    contentHash: string | null;
    signatureVerified: boolean;
  }
): { ok: boolean; missing: string[]; record: CandidateRecord } {
  const missing: string[] = [];
  if (record.license === null) missing.push("license");
  if (evidence.sourceUrl === null) missing.push("source-url");
  if (evidence.immutableRef === null) missing.push("immutable-ref");
  if (evidence.commit === null) missing.push("commit");
  if (evidence.contentHash === null) missing.push("content-hash");
  if (!evidence.signatureVerified) missing.push("signature");
  if (missing.length > 0) {
    return { ok: false, missing, record: { ...record, retrievalLimits: [...record.retrievalLimits] } };
  }
  return {
    ok: true,
    missing: [],
    record: { ...record, status: target, executable: false, retrievalLimits: [...record.retrievalLimits] }
  };
}

export function assessCandidateUse(
  record: CandidateRecord,
  input: {
    capability: CandidateCapability;
    claims: readonly CandidateClaim[];
  }
): CandidateUseAssessment {
  const unsafeClaims: readonly CandidateClaim[] = [
    "detector-evasion",
    "traffic-guarantee",
    "automatic-publish"
  ];
  const rejectedClaims = input.claims.filter(claim => unsafeClaims.includes(claim));
  const allowedClaims = input.claims.filter(claim => !rejectedClaims.includes(claim));
  const capabilityOwner = input.capability === "media-generation"
    ? "image-factory"
    : "content-factory";
  const reasons: string[] = [];

  if (rejectedClaims.length > 0) reasons.push("unsafe-capability-claim");
  if (record.status !== "contract_verified" && record.status !== "live_verified") {
    reasons.push("candidate-not-contract-verified");
  }
  if (record.license === null) reasons.push("license-unverified");
  if (record.evidenceTier !== "package-bytes") reasons.push("package-bytes-unverified");
  if (capabilityOwner === "image-factory") {
    reasons.push("media-generation-owned-by-image-factory");
  }

  const disposition = rejectedClaims.length > 0
    ? "rejected"
    : capabilityOwner === "image-factory"
      ? "external-owner"
      : record.executable && reasons.length === 0
        ? "eligible"
        : "candidate-only";

  return {
    disposition,
    capabilityOwner,
    allowedClaims,
    rejectedClaims,
    reasons
  };
}
