import type { HostProbe } from "../../../../adapters/host/probe.ts";

export type ResolutionState = "resolved" | "inferred" | "needs_clarification" | "unsupported";

export type ChannelTarget = {
  channel: string;
  format: string;
  locale: string;
  audience: string | null;
  goal: string | null;
  taskKind: string;
  requestedAction: string;
  accountRef: string | null;
};

export type PlatformContext = {
  hostContext: {
    hostId: string;
    hostVersion: string | null;
    status: "supported" | "unknown";
    os: HostProbe["os"];
    probeEvidence: string[];
  };
  sourceContexts: Array<{
    sourceId: string;
    sourcePlatform: string;
    uri: string;
  }>;
  channelIntent: {
    channelId: string | null;
    formatId: string | null;
    locale: string | null;
    audience: string | null;
    goal: string | null;
    taskKind: string | null;
    requestedAction: string | null;
    accountRef: string | null;
    resolutionState: ResolutionState;
    resolutionEvidence: string[];
    candidates: string[];
  };
  remoteCalls: 0;
};

const ALIASES: Record<string, string> = { twitter: "x" };
const NON_CHANNELS = new Set(["growth", "podcast", "baidu"]);

function hostContext(host: HostProbe): PlatformContext["hostContext"] {
  const probeEvidence = Object.entries(host.capabilities).map(
    ([capability, probe]) => `${capability}:${probe.status}:${probe.evidence}`
  );
  return {
    hostId: host.host.id,
    hostVersion: host.host.version ?? null,
    status: host.host.status,
    os: { ...host.os },
    probeEvidence
  };
}

function emptyIntent(): PlatformContext["channelIntent"] {
  return {
    channelId: null,
    formatId: null,
    locale: null,
    audience: null,
    goal: null,
    taskKind: null,
    requestedAction: null,
    accountRef: null,
    resolutionState: "needs_clarification",
    resolutionEvidence: ["target-missing"],
    candidates: []
  };
}

export function resolvePlatformContext(input: {
  host: HostProbe;
  sources: Array<{ sourceId: string; platform: string; uri: string }>;
  explicitTarget?: ChannelTarget;
  selectedVariant?: ChannelTarget;
  selectedAccount?: { accountRef: string; channel: string };
  requestText?: string;
}): PlatformContext {
  const sourceContexts = input.sources.map(source => ({
    sourceId: source.sourceId,
    sourcePlatform: source.platform,
    uri: source.uri
  }));
  const target = input.explicitTarget ?? input.selectedVariant;
  let channelIntent = emptyIntent();

  if (target !== undefined) {
    const normalizedChannel = ALIASES[target.channel.toLowerCase()] ?? target.channel.toLowerCase();
    if (NON_CHANNELS.has(normalizedChannel)) {
      channelIntent = {
        ...emptyIntent(),
        formatId: target.format,
        locale: target.locale,
        audience: target.audience,
        goal: target.goal,
        taskKind: target.taskKind,
        requestedAction: target.requestedAction,
        accountRef: target.accountRef,
        resolutionEvidence: [`${normalizedChannel}-is-not-a-destination`]
      };
    } else {
      channelIntent = {
        channelId: normalizedChannel,
        formatId: target.format,
        locale: target.locale,
        audience: target.audience,
        goal: target.goal,
        taskKind: target.taskKind,
        requestedAction: target.requestedAction,
        accountRef: target.accountRef,
        resolutionState: input.explicitTarget === undefined ? "inferred" : "resolved",
        resolutionEvidence: [input.explicitTarget === undefined ? "selected-variant" : "explicit-target"],
        candidates: []
      };
    }
  } else if (input.selectedAccount !== undefined) {
    channelIntent = {
      ...emptyIntent(),
      channelId: input.selectedAccount.channel,
      accountRef: input.selectedAccount.accountRef,
      resolutionState: "inferred",
      resolutionEvidence: ["selected-account"],
      candidates: []
    };
  } else if ((input.requestText ?? "").trim() === "发微信") {
    channelIntent = {
      ...emptyIntent(),
      resolutionEvidence: ["ambiguous-wechat-family"],
      candidates: ["wechat-article", "wechat-video", "wechat-chat"]
    };
  }

  if (
    input.selectedAccount !== undefined
    && channelIntent.channelId !== null
    && input.selectedAccount.channel !== channelIntent.channelId
  ) {
    channelIntent = {
      ...channelIntent,
      resolutionState: "needs_clarification",
      resolutionEvidence: [...channelIntent.resolutionEvidence, "target-account-conflict"]
    };
  }

  return {
    hostContext: hostContext(input.host),
    sourceContexts,
    channelIntent,
    remoteCalls: 0
  };
}
