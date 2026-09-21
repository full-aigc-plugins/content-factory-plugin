import { createHash } from "node:crypto";

import type { ClaimRegistry } from "./claims.ts";

export type RepurposeParent = {
  contentItemId: string;
  revisionId: string;
  text: string;
  detectionReportId: string | null;
  approvalId: string | null;
};

export type RepurposeTarget = {
  channel: string;
  format: string;
};

export type RepurposeChild = {
  contentItemId: string;
  lineage: {
    parentContentItemId: string;
    parentRevisionId: string;
  };
  channel: string;
  format: string;
  detectionReportId: null;
  approvalId: null;
  reviewRequired: true;
};

export type RepurposeRequest = {
  parent: RepurposeParent;
  claimRegistry: ClaimRegistry;
  target: RepurposeTarget;
  child: RepurposeChild;
};

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function createRepurposeRequest(input: {
  parent: RepurposeParent;
  claimRegistry: ClaimRegistry;
  target: RepurposeTarget;
}): RepurposeRequest {
  const identity = digest({
    parentContentItemId: input.parent.contentItemId,
    parentRevisionId: input.parent.revisionId,
    channel: input.target.channel,
    format: input.target.format
  }).slice(0, 24);

  return {
    parent: { ...input.parent },
    claimRegistry: {
      ...input.claimRegistry,
      claims: input.claimRegistry.claims.map(claim => ({
        ...claim,
        evidence: claim.evidence.map(item => ({ ...item }))
      })),
      conflicts: input.claimRegistry.conflicts.map(conflict => ({
        ...conflict,
        claimIds: [...conflict.claimIds]
      }))
    },
    target: { ...input.target },
    child: {
      contentItemId: `derived_${identity}`,
      lineage: {
        parentContentItemId: input.parent.contentItemId,
        parentRevisionId: input.parent.revisionId
      },
      channel: input.target.channel,
      format: input.target.format,
      detectionReportId: null,
      approvalId: null,
      reviewRequired: true
    }
  };
}

export function supportedNumbers(request: RepurposeRequest): Set<string> {
  const values = new Set<string>();
  const texts = [
    request.parent.text,
    ...request.claimRegistry.claims.map(claim => claim.statement)
  ];
  for (const text of texts) {
    for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/gu)) {
      values.add(match[0]);
    }
  }
  return values;
}
