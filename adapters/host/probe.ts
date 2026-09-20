export type CapabilityStatus = "available" | "unavailable" | "unknown";

export type CapabilityProbe = {
  status: CapabilityStatus;
  evidence: string;
};

export type HostProbe = {
  host: {
    id: string;
    version?: string;
    status: "supported" | "unknown";
  };
  os: {
    platform: string;
    arch: string;
  };
  capabilities: {
    search: CapabilityProbe;
    browser: CapabilityProbe;
    imageFactory: CapabilityProbe;
    credentialStore: CapabilityProbe;
    mcp: CapabilityProbe;
    filesystem: CapabilityProbe;
  };
};

type ProbeInput = {
  env?: Record<string, string | undefined>;
  platform?: string;
  arch?: string;
};

const SUPPORTED_HOSTS = new Set(["codex", "zcode", "kimi"]);
const CAPABILITY_KEYS = {
  search: "search",
  browser: "browser",
  "image-factory": "imageFactory",
  "credential-store": "credentialStore",
  mcp: "mcp",
  filesystem: "filesystem"
} as const;

function normalizeHost(value: string | undefined): string {
  const id = (value ?? "").trim().toLowerCase();
  return id || "unknown";
}

function capabilityManifest(raw: string | undefined) {
  const result = new Map<string, CapabilityStatus>();
  for (const item of (raw ?? "").split(",")) {
    const token = item.trim().toLowerCase();
    if (!token) continue;
    if (token.startsWith("!")) result.set(token.slice(1), "unavailable");
    else result.set(token, "available");
  }
  return result;
}

export function probeHost(input: ProbeInput = {}): HostProbe {
  const env = input.env ?? {};
  const id = normalizeHost(env.CONTENT_FACTORY_HOST_ID);
  const manifest = capabilityManifest(env.CONTENT_FACTORY_HOST_CAPABILITIES);
  const capabilities: Record<string, CapabilityProbe> = {};

  for (const [externalName, internalName] of Object.entries(CAPABILITY_KEYS)) {
    const status = manifest.get(externalName) ?? "unknown";
    capabilities[internalName] = {
      status,
      evidence: manifest.has(externalName)
        ? "explicit host capability manifest"
        : "not declared by host capability manifest"
    };
  }

  const host: HostProbe["host"] = {
    id,
    status: SUPPORTED_HOSTS.has(id) ? "supported" : "unknown"
  };
  const version = env.CONTENT_FACTORY_HOST_VERSION?.trim();
  if (version) host.version = version;

  return {
    host,
    os: {
      platform: input.platform ?? "unknown",
      arch: input.arch ?? "unknown"
    },
    capabilities: capabilities as HostProbe["capabilities"]
  };
}
