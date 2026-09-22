export async function backupWorkspaceDatabase(
  _stateDir: string,
  destination: string
): Promise<{ path: string; bytes: number; sha256: string }> {
  return { path: destination, bytes: 0, sha256: "" };
}
