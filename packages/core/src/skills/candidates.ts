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
