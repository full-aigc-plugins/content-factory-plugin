import { createHash } from "node:crypto";

export type ChannelVariantTarget = {
  channelId: string;
  formatId: string;
  locale: string;
  text: string;
  presentation: string;
};

export type ChannelVariant = ChannelVariantTarget & {
  sourceBundleId: string;
  siblingGroupId: string;
  variantId: string;
  revisionId: string;
  revisionNumber: number;
  textHash: string;
  presentationHash: string;
};

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function revisionId(variantId: string, revisionNumber: number, textHash: string): string {
  return `revision_${digest([variantId, revisionNumber, textHash]).slice(0, 24)}`;
}

export function createChannelVariants(input: {
  sourceBundleId: string;
  targets: ChannelVariantTarget[];
}): ChannelVariant[] {
  const siblingGroupId = `siblings_${digest([
    input.sourceBundleId,
    input.targets.map(target => [target.channelId, target.formatId, target.locale])
  ]).slice(0, 24)}`;
  return input.targets.map((target, index) => {
    const variantId = `variant_${digest([
      siblingGroupId, index, target.channelId, target.formatId, target.locale
    ]).slice(0, 24)}`;
    const textHash = digest(target.text);
    return {
      ...target,
      sourceBundleId: input.sourceBundleId,
      siblingGroupId,
      variantId,
      revisionId: revisionId(variantId, 1, textHash),
      revisionNumber: 1,
      textHash,
      presentationHash: digest(target.presentation)
    };
  });
}

export function reviseChannelVariant(
  variants: ChannelVariant[],
  input: {
    variantId: string;
    expectedRevisionId: string;
    text: string;
    presentation?: string;
  }
):
  | { status: "advanced"; variant: ChannelVariant; variants: ChannelVariant[] }
  | { status: "conflict"; variants: ChannelVariant[] } {
  const index = variants.findIndex(variant => variant.variantId === input.variantId);
  const current = variants[index];
  if (!current || current.revisionId !== input.expectedRevisionId) {
    return { status: "conflict", variants };
  }

  const revisionNumber = current.revisionNumber + 1;
  const textHash = digest(input.text);
  const presentation = input.presentation ?? current.presentation;
  const variant: ChannelVariant = {
    ...current,
    text: input.text,
    presentation,
    textHash,
    presentationHash: digest(presentation),
    revisionNumber,
    revisionId: revisionId(current.variantId, revisionNumber, textHash)
  };
  const next = variants.slice();
  next[index] = variant;
  return { status: "advanced", variant, variants: next };
}
