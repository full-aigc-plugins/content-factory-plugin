import type { NormalizedDetectionSegment } from "./normalize.ts";

export type LocatedDetectionSegment = NormalizedDetectionSegment & {
  locationStatus: "located" | "ambiguous" | "not-found" | "unsafe-boundary";
  startUtf16: number | null;
  endUtf16: number | null;
  startCodePoint: number | null;
  endCodePoint: number | null;
  startGrapheme: number | null;
  endGrapheme: number | null;
  warning: string | null;
};

function unresolved(
  segment: NormalizedDetectionSegment,
  status: LocatedDetectionSegment["locationStatus"],
  warning: string
): LocatedDetectionSegment {
  return {
    ...segment,
    locationStatus: status,
    startUtf16: null,
    endUtf16: null,
    startCodePoint: null,
    endCodePoint: null,
    startGrapheme: null,
    endGrapheme: null,
    warning
  };
}

function allMatches(text: string, search: string): number[] {
  const matches: number[] = [];
  let offset = 0;
  while (offset <= text.length) {
    const found = text.indexOf(search, offset);
    if (found < 0) break;
    matches.push(found);
    offset = found + 1;
  }
  return matches;
}

function graphemeBoundaries(text: string): number[] {
  const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
  const boundaries = Array.from(segmenter.segment(text), part => part.index);
  boundaries.push(text.length);
  return boundaries;
}

export function locateDetectionSegments(
  canonicalText: string,
  segments: NormalizedDetectionSegment[]
): LocatedDetectionSegment[] {
  const boundaries = graphemeBoundaries(canonicalText);
  return segments.map(segment => {
    const matches = allMatches(canonicalText, segment.text);
    if (matches.length === 0) {
      return unresolved(segment, "not-found", "provider-text-not-found");
    }
    if (matches.length > 1) {
      return unresolved(segment, "ambiguous", "ambiguous-text-match");
    }

    const startUtf16 = matches[0];
    const endUtf16 = startUtf16 + segment.text.length;
    const startGrapheme = boundaries.indexOf(startUtf16);
    const endGrapheme = boundaries.indexOf(endUtf16);
    if (startGrapheme < 0 || endGrapheme < 0) {
      return unresolved(segment, "unsafe-boundary", "unsafe-grapheme-boundary");
    }

    return {
      ...segment,
      locationStatus: "located",
      startUtf16,
      endUtf16,
      startCodePoint: Array.from(canonicalText.slice(0, startUtf16)).length,
      endCodePoint: Array.from(canonicalText.slice(0, endUtf16)).length,
      startGrapheme,
      endGrapheme,
      warning: null
    };
  });
}
