import { createHash } from "node:crypto";

export type AuthorStyle = {
  tone: string[];
  sentenceRhythm: "short" | "balanced" | "long";
  averageSentenceLength: number;
};

export type AuthorProfile = {
  profileId: string;
  revision: number;
  style: AuthorStyle;
  protectedTerms: string[];
  blockedPhrases: string[];
  sourceSampleCount: number;
  fingerprint: string;
};

export type AuthorProfileInput = {
  profileId: string;
  sampleTexts: string[];
  privateFacts?: string[];
  protectedTerms: string[];
  blockedPhrases: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function sanitizeSample(text: string, privateFacts: string[]): string {
  let sanitized = text;
  for (const fact of privateFacts) {
    if (!fact) continue;
    sanitized = sanitized.split(fact).join("");
  }
  return sanitized;
}

function sentenceLengths(texts: string[]): number[] {
  return texts.flatMap(text =>
    text
      .split(/[。！？!?\n]+/u)
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => [...value].length)
  );
}

function inferStyle(sampleTexts: string[], privateFacts: string[]): AuthorStyle {
  const sanitized = sampleTexts.map(text => sanitizeSample(text, privateFacts));
  const lengths = sentenceLengths(sanitized);
  if (lengths.length === 0) {
    return {
      tone: ["clear", "specific"],
      sentenceRhythm: "balanced",
      averageSentenceLength: 0
    };
  }

  const averageSentenceLength =
    Math.round((lengths.reduce((sum, value) => sum + value, 0) / lengths.length) * 10) / 10;
  const sentenceRhythm: AuthorStyle["sentenceRhythm"] =
    averageSentenceLength < 12 ? "short" : averageSentenceLength > 28 ? "long" : "balanced";

  return {
    tone: ["clear", "specific"],
    sentenceRhythm,
    averageSentenceLength
  };
}

function fingerprintProfile(input: Omit<AuthorProfile, "fingerprint">): string {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export function createAuthorProfile(input: AuthorProfileInput): AuthorProfile {
  const privateFacts = uniqueSorted(input.privateFacts ?? []);
  const base: Omit<AuthorProfile, "fingerprint"> = {
    profileId: input.profileId,
    revision: 1,
    style: inferStyle(input.sampleTexts, privateFacts),
    protectedTerms: uniqueSorted(input.protectedTerms),
    blockedPhrases: uniqueSorted(input.blockedPhrases),
    sourceSampleCount: input.sampleTexts.length
  };
  return { ...base, fingerprint: fingerprintProfile(base) };
}

export function reviseAuthorProfile(
  previous: AuthorProfile,
  input: Omit<AuthorProfileInput, "profileId">
): AuthorProfile {
  const privateFacts = uniqueSorted(input.privateFacts ?? []);
  const base: Omit<AuthorProfile, "fingerprint"> = {
    profileId: previous.profileId,
    revision: previous.revision + 1,
    style: inferStyle(input.sampleTexts, privateFacts),
    protectedTerms: uniqueSorted(input.protectedTerms),
    blockedPhrases: uniqueSorted(input.blockedPhrases),
    sourceSampleCount: input.sampleTexts.length
  };
  return { ...base, fingerprint: fingerprintProfile(base) };
}

export type ProtectedTermViolation = {
  term: string;
  beforeCount: number;
  afterCount: number;
};

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;
  return text.split(term).length - 1;
}

export function validateProtectedTerms(
  before: string,
  after: string,
  profile: AuthorProfile
): ProtectedTermViolation[] {
  const violations: ProtectedTermViolation[] = [];
  for (const term of profile.protectedTerms) {
    const beforeCount = countOccurrences(before, term);
    if (beforeCount === 0) continue;
    const afterCount = countOccurrences(after, term);
    if (afterCount !== beforeCount) {
      violations.push({ term, beforeCount, afterCount });
    }
  }
  return violations;
}
