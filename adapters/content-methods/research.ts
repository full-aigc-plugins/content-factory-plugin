import type { SourceBundle } from "../../packages/core/src/content/claims.ts";

export type ResearchContext = {
  mode: "search-assisted" | "materials-only";
  sources: SourceBundle["sources"];
};

export function buildResearchContext(input: {
  sourceBundle: SourceBundle;
  searchAvailable: boolean;
}): ResearchContext {
  return {
    mode: input.searchAvailable ? "search-assisted" : "materials-only",
    sources: input.sourceBundle.sources.map(source => ({
      ...source,
      locator: { ...source.locator }
    }))
  };
}
