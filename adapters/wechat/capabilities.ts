import type { ChannelDeliveryCapability } from "../../packages/core/src/delivery/capabilities.ts";

export function declareOfficialContentCapabilities(input: {
  accountAlias: string;
  apiLiveVerified: boolean;
  browserLiveVerified: boolean;
  readbackLiveVerified: boolean;
}): ChannelDeliveryCapability[] {
  const base = {
    channelId: "wechat-article",
    formatIds: ["article", "image_text"],
    accountAlias: input.accountAlias,
    contractVerified: true
  };
  return [
    {
      ...base,
      capabilityId: "content-platform-article-api-draft-v1",
      adapterId: "content-platform-article-api",
      actions: ["draft"],
      liveVerified: input.apiLiveVerified
    },
    {
      ...base,
      capabilityId: "content-platform-article-browser-draft-v1",
      adapterId: "content-platform-article-browser",
      actions: ["draft"],
      liveVerified: input.browserLiveVerified
    },
    {
      ...base,
      capabilityId: "content-platform-article-readback-v1",
      adapterId: "content-platform-article-readback",
      actions: ["read"],
      liveVerified: input.readbackLiveVerified
    }
  ];
}
