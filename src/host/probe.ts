export type HostResolution = "resolved" | "inferred" | "unknown";

export interface HostContext {
  hostId: string;
  hostVersion?: string;
  os: string;
  resolution: HostResolution;
  availableTools: string[];
  browserModes: string[];
  credentialRefs: string[];
  externalPlugins: string[];
  filesystemScope: string;
  evidence: string[];
  warnings: string[];
}

export interface HostProbeInput {
  env: Record<string, string | undefined>;
  platform: string;
  onNetworkAttempt?: () => void;
}

interface CapabilityInventory {
  tools?: unknown;
  browserModes?: unknown;
  credentialRefs?: unknown;
  externalPlugins?: unknown;
  filesystemScope?: unknown;
}

function normalizedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))]
    .map((item) => item.trim())
    .sort();
}

function inferHost(env: Record<string, string | undefined>): { hostId: string; resolution: HostResolution; evidence: string[] } {
  const explicit = env.CONTENT_FACTORY_HOST?.trim();
  if (explicit) {
    return { hostId: explicit.toLowerCase(), resolution: "resolved", evidence: ["env:CONTENT_FACTORY_HOST"] };
  }
  if (env.CODEX_HOME || env.CODEX_SANDBOX_NETWORK_DISABLED) {
    return { hostId: "codex", resolution: "inferred", evidence: ["env:CODEX_*"] };
  }
  if (env.ZCODE_HOME) {
    return { hostId: "zcode", resolution: "inferred", evidence: ["env:ZCODE_HOME"] };
  }
  if (env.KIMI_HOME || env.KIMI_CODE_HOME) {
    return { hostId: "kimi", resolution: "inferred", evidence: ["env:KIMI_*"] };
  }
  return { hostId: "unknown", resolution: "unknown", evidence: [] };
}

export function probeHostContext(input: HostProbeInput): HostContext {
  const host = inferHost(input.env);
  const warnings: string[] = [];
  let inventory: CapabilityInventory = {};

  const raw = input.env.CONTENT_FACTORY_CAPABILITIES;
  if (raw?.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        inventory = parsed as CapabilityInventory;
      } else {
        warnings.push("CONTENT_FACTORY_CAPABILITIES must be a JSON object");
      }
    } catch {
      warnings.push("CONTENT_FACTORY_CAPABILITIES contains invalid JSON");
    }
  }

  const filesystemScope =
    typeof inventory.filesystemScope === "string" && inventory.filesystemScope.trim()
      ? inventory.filesystemScope.trim()
      : input.env.CONTENT_FACTORY_FILESYSTEM_SCOPE?.trim() || "unknown";

  return {
    hostId: host.hostId,
    hostVersion: input.env.CONTENT_FACTORY_HOST_VERSION?.trim() || undefined,
    os: input.platform,
    resolution: host.resolution,
    availableTools: normalizedStrings(inventory.tools),
    browserModes: normalizedStrings(inventory.browserModes),
    credentialRefs: normalizedStrings(inventory.credentialRefs),
    externalPlugins: normalizedStrings(inventory.externalPlugins),
    filesystemScope,
    evidence: [
      ...host.evidence,
      ...(raw?.trim() ? ["env:CONTENT_FACTORY_CAPABILITIES"] : []),
      ...(input.env.CONTENT_FACTORY_FILESYSTEM_SCOPE?.trim() ? ["env:CONTENT_FACTORY_FILESYSTEM_SCOPE"] : [])
    ],
    warnings
  };
}
