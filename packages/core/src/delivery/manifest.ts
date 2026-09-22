export async function loadExportManifest(
  _root: string
): Promise<Record<string, unknown>> {
  return {};
}

export async function verifyExportManifest(
  _root: string
): Promise<{ valid: boolean; mismatches: string[] }> {
  return { valid: false, mismatches: ["not-implemented"] };
}
