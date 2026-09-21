import { createHash } from "node:crypto";

export type VoiceProfile = {
  source: "default" | "samples";
  averageSentenceChars: number;
  shortSentenceRatio: number;
  guidance: string[];
};

export type AuthorProfile = {
  profileId: string;
  revisionId: string;
  revision: number;
  parentRevisionId: string | null;
  sampleHashes: string[];
  voice: VoiceProfile;
  protectedTerms: string[];
  forbiddenExpressions: string[];
};

export type AuthorProfileInput = {
  profileId: string;
  samples?: string[];
  protectedTerms?: string[];
  forbiddenExpressions?: string[];
};

export type AuthorProfileRevisionInput = Omit<AuthorProfileInput, "profileId">;

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function uniqueExact(values: string[] = []): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function sentences(text: string): string[] {
  return text
    .split(/[。！？!?\n]+/u)
    .map(value => value.trim())
    .filter(Boolean);
}

function deriveVoice(samples: string[]): VoiceProfile {
  const usable = samples.map(sample => sample.trim()).filter(Boolean);
  if (usable.length === 0) {
    return {
      source: "default",
      averageSentenceChars: 0,
      shortSentenceRatio: 0,
      guidance: [
        "Prefer clear, concrete sentences.",
        "State supported conclusions before explanation.",
        "Do not invent personal experience or private facts."
      ]
    };
  }

  const sampleSentences = usable.flatMap(sentences);
  const lengths = sampleSentences.map(value => [...value].length);
  const averageSentenceChars = lengths.length
    ? Number((lengths.reduce((sum, value) => sum + value, 0) / lengths.length).toFixed(2))
    : 0;
  const shortSentenceRatio = lengths.length
    ? Number((lengths.filter(value => value <= 20).length / lengths.length).toFixed(3))
    : 0;

  const guidance = [
    averageSentenceChars > 0 && averageSentenceChars <= 20
      ? "Prefer concise sentence rhythm."
      : "Allow medium-length explanatory sentences.",
    shortSentenceRatio >= 0.5
      ? "Use frequent sentence breaks where meaning remains clear."
      : "Use paragraph continuity without artificially fragmenting ideas.",
    "Use samples only for style statistics; never copy sample-specific people, clients, events, metrics, or anecdotes."
  ];

  return { source: "samples", averageSentenceChars, shortSentenceRatio, guidance };
}

function revisionId(input: Omit<AuthorProfile, "revisionId">): string {
  const canonical = JSON.stringify(input);
  return "apr_" + sha256(canonical).slice(0, 24);
}

function build(
  profileId: string,
  revision: number,
  parentRevisionId: string | null,
  input: AuthorProfileRevisionInput
): AuthorProfile {
  if (!profileId.trim()) throw new Error("author profileId is required");
  const samples = (input.samples ?? []).map(value => value.trim()).filter(Boolean);
  const sampleHashes = samples.map(sha256);
  const partial = {
    profileId: profileId.trim(),
    revision,
    parentRevisionId,
    sampleHashes,
    voice: deriveVoice(samples),
    protectedTerms: uniqueExact(input.protectedTerms),
    forbiddenExpressions: uniqueExact(input.forbiddenExpressions)
  };
  return { ...partial, revisionId: revisionId(partial) };
}

export function createAuthorProfile(input: AuthorProfileInput): AuthorProfile {
  return build(input.profileId, 1, null, input);
}

export function reviseAuthorProfile(
  current: AuthorProfile,
  input: AuthorProfileRevisionInput
): AuthorProfile {
  return build(current.profileId, current.revision + 1, current.revisionId, {
    samples: input.samples ?? [],
    protectedTerms: input.protectedTerms ?? current.protectedTerms,
    forbiddenExpressions: input.forbiddenExpressions ?? current.forbiddenExpressions
  });
}

export function protectedTermsFor(profile: AuthorProfile): string[] {
  return [...profile.protectedTerms];
}
