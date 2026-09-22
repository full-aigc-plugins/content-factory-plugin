import type { ChannelVariant } from "../content/channel-variants.ts";

export type ChannelValidity = {
  detectionReusable: boolean;
  approvalReusable: boolean;
  deliveryReviewRequired: boolean;
  reasons: string[];
};

export function evaluateChannelValidity(input: {
  previous: ChannelVariant;
  current: ChannelVariant;
}): ChannelValidity {
  const reasons: string[] = [];
  if (input.previous.sourceBundleId !== input.current.sourceBundleId) {
    reasons.push("source-bundle-changed");
  }
  if (input.previous.channelId !== input.current.channelId) {
    reasons.push("channel-changed");
  }
  if (input.previous.formatId !== input.current.formatId) {
    reasons.push("format-changed");
  }
  if (input.previous.locale !== input.current.locale) {
    reasons.push("locale-changed");
  }
  if (input.previous.textHash !== input.current.textHash) {
    reasons.push("canonical-text-changed");
  }

  const detectionReusable = reasons.length === 0;
  const presentationChanged = input.previous.presentationHash !== input.current.presentationHash;
  if (presentationChanged) reasons.push("presentation-changed");
  const approvalReusable = detectionReusable && !presentationChanged;
  return {
    detectionReusable,
    approvalReusable,
    deliveryReviewRequired: !approvalReusable,
    reasons
  };
}
