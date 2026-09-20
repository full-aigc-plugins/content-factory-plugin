import { randomUUID } from "node:crypto";

import type {
  RevisionCommitResult,
  RevisionRecord,
  WorkspaceStore
} from "../workspace/store.ts";

export type RevisionAuthorKind = "human" | "agent" | "system";

export type ContentItemCreated = {
  itemId: string;
  headRevisionId: string;
  revision: RevisionRecord;
};

export type SubmitRevisionResult = RevisionCommitResult & {
  revision: RevisionRecord;
};

function identifier(prefix: "item" | "rev"): string {
  return prefix + "_" + randomUUID().replaceAll("-", "");
}

export async function createContentItem(
  store: WorkspaceStore,
  input: { text: string; authorKind: RevisionAuthorKind }
): Promise<ContentItemCreated> {
  const object = await store.putObject(Buffer.from(input.text, "utf8"));
  const itemId = identifier("item");
  const revision: RevisionRecord = {
    revisionId: identifier("rev"),
    itemId,
    parentRevisionId: null,
    objectSha256: object.sha256,
    authorKind: input.authorKind,
    createdAt: new Date().toISOString()
  };
  store.createContentRecord({ itemId, revision });
  return { itemId, headRevisionId: revision.revisionId, revision };
}

export async function submitRevision(
  store: WorkspaceStore,
  input: {
    itemId: string;
    expectedRevisionId: string;
    text: string;
    authorKind: RevisionAuthorKind;
  }
): Promise<SubmitRevisionResult> {
  const object = await store.putObject(Buffer.from(input.text, "utf8"));
  const revision: RevisionRecord = {
    revisionId: identifier("rev"),
    itemId: input.itemId,
    parentRevisionId: input.expectedRevisionId,
    objectSha256: object.sha256,
    authorKind: input.authorKind,
    createdAt: new Date().toISOString()
  };
  const result = store.commitRevision({
    ...revision,
    expectedRevisionId: input.expectedRevisionId
  });
  return { ...result, revision };
}

export function rollbackContentHead(
  store: WorkspaceStore,
  input: {
    itemId: string;
    expectedRevisionId: string;
    targetRevisionId: string;
  }
): RevisionCommitResult {
  return store.rollbackHead(input);
}
