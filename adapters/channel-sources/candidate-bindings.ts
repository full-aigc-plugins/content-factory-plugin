export type ChannelCandidateCapability = "acquire" | "author" | "deliver";

export type ChannelCandidate = {
  id: string;
  displayName: string;
  mechanism: "vendor-skill" | "channel-skill" | "mcp-wrapper" | "mcp-server";
  channelIds: readonly string[];
  formatIds: readonly string[];
  capabilities: readonly ChannelCandidateCapability[];
  evidenceTier: "package-bytes" | "historical-lead" | "readme-only";
  contractStatus: "verified" | "unverified";
};

export type CandidateAssessment = {
  eligible: boolean;
  reasons: Array<
    | "channel-mismatch"
    | "format-mismatch"
    | "capability-mismatch"
    | "backend-requires-reviewed-wrapper"
    | "contract-unverified"
  >;
};

export const CHANNEL_CANDIDATES: readonly ChannelCandidate[] = Object.freeze([
  {
    id: "shared-social-authoring",
    displayName: "marketingskills/social",
    mechanism: "vendor-skill",
    channelIds: ["*"],
    formatIds: ["note", "thread", "post", "caption", "short-video-script", "video-script"],
    capabilities: ["author"],
    evidenceTier: "package-bytes",
    contractStatus: "verified"
  },
  {
    id: "xiaohongshu-content",
    displayName: "xiaohongshu-content",
    mechanism: "channel-skill",
    channelIds: ["xiaohongshu"],
    formatIds: ["note"],
    capabilities: ["author"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  },
  {
    id: "xiaohongshu-mcp-server",
    displayName: "xpzouying/xiaohongshu-mcp",
    mechanism: "mcp-server",
    channelIds: ["xiaohongshu"],
    formatIds: ["note"],
    capabilities: ["acquire", "deliver"],
    evidenceTier: "readme-only",
    contractStatus: "unverified"
  },
  {
    id: "xiaohongshu-mcp-wrapper",
    displayName: "xiaohongshu-mcp-skill",
    mechanism: "mcp-wrapper",
    channelIds: ["xiaohongshu"],
    formatIds: ["note"],
    capabilities: ["acquire", "deliver"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  },
  {
    id: "wechat-article-search",
    displayName: "wechat-article-search",
    mechanism: "channel-skill",
    channelIds: ["wechat-article"],
    formatIds: ["article"],
    capabilities: ["acquire"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  },
  {
    id: "wechat-account-article-adapter",
    displayName: "baoyu-post-to-wechat",
    mechanism: "channel-skill",
    channelIds: ["wechat-article"],
    formatIds: ["article"],
    capabilities: ["deliver"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  },
  {
    id: "wechat-video-publisher",
    displayName: "wechat-video-publish",
    mechanism: "channel-skill",
    channelIds: ["wechat-video"],
    formatIds: ["video"],
    capabilities: ["deliver"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  },
  {
    id: "zhihu-thought-publisher",
    displayName: "social-push/zhihu-thought",
    mechanism: "channel-skill",
    channelIds: ["zhihu"],
    formatIds: ["thought"],
    capabilities: ["deliver"],
    evidenceTier: "historical-lead",
    contractStatus: "unverified"
  }
]);

function includes(values: readonly string[], value: string): boolean {
  return values.includes("*") || values.includes(value);
}

export function assessChannelCandidate(
  candidate: ChannelCandidate,
  request: {
    channelId: string;
    formatId: string;
    capability: ChannelCandidateCapability;
  }
): CandidateAssessment {
  const reasons: CandidateAssessment["reasons"] = [];
  if (!includes(candidate.channelIds, request.channelId)) reasons.push("channel-mismatch");
  if (!includes(candidate.formatIds, request.formatId)) reasons.push("format-mismatch");
  if (!candidate.capabilities.includes(request.capability)) reasons.push("capability-mismatch");
  if (candidate.mechanism === "mcp-server") reasons.push("backend-requires-reviewed-wrapper");
  if (candidate.contractStatus !== "verified") reasons.push("contract-unverified");
  return { eligible: reasons.length === 0, reasons };
}
