export async function runControlledDraftBrowser(
  _input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return {
    status: "blocked",
    reason: "not-implemented",
    remoteDraftId: null,
    evidence: [],
    differences: []
  };
}
