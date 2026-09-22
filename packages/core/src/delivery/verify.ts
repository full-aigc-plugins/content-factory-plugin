export function verifyDraftReadback(_input: unknown) {
  return { status: "unknown", differences: [], remoteDraftId: null };
}

export async function reconcileUnknownDraft(_input: unknown) {
  return { status: "unknown", differences: [], remoteDraftId: null };
}
