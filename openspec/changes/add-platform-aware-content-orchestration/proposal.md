# Platform-aware Content Factory integration

## Why

The V1 harness discovers the execution host and routes generic stages, but does not sufficiently distinguish a source platform from a target publishing channel. It can therefore choose a generic article workflow for a short-video script, confuse WeChat Official Accounts with WeChat Channels, or select a publisher before the authoring strategy is known.

The user's historical Content Ops library already separates channel strategy and seven operating responsibilities. Current SkillHub discovery adds possible methods and connectors, but catalog ranking is not an installation or production-readiness guarantee.

## What Changes

- Resolve HostContext and ChannelIntent independently before channel-specific research, structure, writing, editing, assets, or delivery.
- Introduce versioned ChannelProfile and ContentRecipe definitions for 16 channels; preserve distinctions among platform, content format, locale, goal, and account.
- Convert the historical seven-agent arrangement into task-specific stages under the existing single `content-harness`, not seven permanent agents per platform.
- Select vendor skills by capability, channel/format suitability, installed version, host compatibility, permissions, evidence, and budget. Load only the chosen route.
- Add a provenance-aware SkillHub discovery/admission process and a reviewed candidate matrix, including exclusions and unresolved identities.
- Keep separate channel variants, final-text detection evidence, asset receipts, approvals, and delivery statuses for multi-channel work.
- Define read-only measurement and comment-draft feedback without enabling autonomous publishing, commenting, private messaging, or moderation.
- Preserve CF-001–CF-042; add CF-043–CF-058 with concrete acceptance cases.

## Capabilities

### New Capabilities

- `platform-context-resolution`: resolve host, source platform, target channel, format, account, and ambiguity.
- `channel-recipe-selection`: versioned channel profiles and stage-specific strategy selection.
- `skill-admission-routing`: evidence-based candidate admission and compatible runtime skill selection.
- `multichannel-variant-isolation`: isolate revisions, reports, assets, approval, and partial results.
- `content-ops-feedback`: scoped metrics/comments and reversible recipe improvement proposals.
- `channel-integration-acceptance`: routing, content-quality, vendor, and live-channel acceptance matrices.

### Modified Capabilities

None in canonical `openspec/specs`: the base V1 change is still pending. These new capabilities supplement its harness, supply-chain, rendering, delivery, and release requirements. Existing rules remain binding.

## Impact

Future implementation touches the single local harness, kernel channel/recipe/skill registries, source/variant metadata, permission-aware adapters, and tests. This commit creates specification and integration-planning artifacts only; it does not install external packages or claim platform API access.

## Non-goals

No additional local channel skills; no duplicate image/video engine; no unrestricted browser fallback; no automatic latest-version installation; no guaranteed detector score; no fake personal experience, interaction, or algorithm claims. V1 verified remote delivery remains WeChat drafts unless another channel is explicitly promoted through its own release gates. All 16 channels are strategy/authoring coverage targets, not 16 verified publishing integrations.
