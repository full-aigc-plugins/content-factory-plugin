export type SharedVendorMethod = {
  skillId: string;
  aliases: readonly string[];
  capabilities: readonly string[];
  source: {
    package: "marketingskills";
    ref: "v2.9.1";
    commit: "2c13accb72ee1feb847dedf16c6e59a53ee45c9b";
  };
  upstreamSha256: string;
  effectiveSha256: string;
  patchSha256: null;
  permissionClass: "candidate-only";
  requiresKernelValidation: true;
  directActions: readonly string[];
};

function method(input: {
  skillId: string;
  aliases: string[];
  capabilities: string[];
  sha256: string;
}): SharedVendorMethod {
  return Object.freeze({
    skillId: input.skillId,
    aliases: Object.freeze([...input.aliases]),
    capabilities: Object.freeze([...input.capabilities]),
    source: Object.freeze({
      package: "marketingskills" as const,
      ref: "v2.9.1" as const,
      commit: "2c13accb72ee1feb847dedf16c6e59a53ee45c9b" as const
    }),
    upstreamSha256: input.sha256,
    effectiveSha256: input.sha256,
    patchSha256: null,
    permissionClass: "candidate-only" as const,
    requiresKernelValidation: true as const,
    directActions: Object.freeze([])
  });
}

export const SHARED_VENDOR_METHODS: readonly SharedVendorMethod[] = Object.freeze([
  method({
    skillId: "content-strategy",
    aliases: ["content-strategy", "topic-strategy"],
    capabilities: ["topic.strategy"],
    sha256: "e262522f71a023938fd56f33151a954869a754c5142f09abc476e45414ce2b89"
  }),
  method({
    skillId: "product-marketing",
    aliases: ["product-marketing", "product-marketing-context"],
    capabilities: ["context.product"],
    sha256: "ebef5ee2c7b176af246680c77cab06d67e09c7be007a522626ad581426c9d12f"
  }),
  method({
    skillId: "copywriting",
    aliases: ["copywriting", "marketing-copy"],
    capabilities: ["writing.marketing"],
    sha256: "506f46f6bbb3b9c414a3d1d78fb1c598f0ed952a7d483cdd2a6ed33412a3198f"
  }),
  method({
    skillId: "copy-editing",
    aliases: ["copy-editing", "copyediting"],
    capabilities: ["editing.copy"],
    sha256: "2e9cd386736dbf7fc9555b5787af804b573611db1a1ea1b9a3857d019d2f112a"
  }),
  method({
    skillId: "social",
    aliases: ["social", "social-content"],
    capabilities: ["writing.social", "writing.spoken"],
    sha256: "e869e9ba894d3734f72482138b6307045576746bd3e7c01979aaad87545d5811"
  })
]);

const METHODS_BY_ALIAS = new Map(
  SHARED_VENDOR_METHODS.flatMap(item => item.aliases.map(alias => [alias, item] as const))
);

export function resolveSharedVendorMethod(alias: string): SharedVendorMethod | null {
  return METHODS_BY_ALIAS.get(alias.trim().toLowerCase()) ?? null;
}
