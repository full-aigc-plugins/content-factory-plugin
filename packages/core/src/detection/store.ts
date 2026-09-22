import type { ObjectRecord } from "../workspace/objects.ts";
import type { WorkspaceStore } from "../workspace/store.ts";

export type RawDetectionResponse = ObjectRecord;

export type DetectionEvidenceStore = {
  putRaw(bytes: Uint8Array): Promise<RawDetectionResponse>;
};

export class WorkspaceDetectionStore implements DetectionEvidenceStore {
  readonly #workspace: Pick<WorkspaceStore, "putObject">;

  constructor(workspace: Pick<WorkspaceStore, "putObject">) {
    this.#workspace = workspace;
  }

  putRaw(bytes: Uint8Array): Promise<RawDetectionResponse> {
    return this.#workspace.putObject(bytes);
  }
}
