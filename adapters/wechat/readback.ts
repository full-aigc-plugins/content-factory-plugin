export function createOfficialContentReadbackApi(_transport: unknown) {
  return {
    async findByClientRequest() { return []; },
    async readDraft() { return null; }
  };
}
