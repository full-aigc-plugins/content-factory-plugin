# Content Factory V1 Proposal

## Why

Content Factory must ship as a usable content-production plugin rather than a prompt bundle. The previously approved V1 scope already covers source ingestion, research and writing, editorial refinement, deterministic formatting, real AI content detection platform integration, explicit approval, portable export, content-platform article draft delivery, recovery, and release evidence.

The implementation architecture is now refined to align with the existing Full AIGC plugin ecosystem:

1. reuse mature external content skills instead of reimplementing equivalent prompt workflows;
2. keep exactly one plugin-local orchestration skill, `content-harness`;
3. keep versions, claims, fact protection, approvals, detection validity, delivery state, recovery, and evidence in a deterministic runtime kernel;
4. delegate image generation and visual production to `image-factory-plugin` rather than vendoring image-generation skills into Content Factory.

This refinement changes implementation ownership, not the approved V1 business outcome.

## What Changes

- Introduce an immutable external-skill supply chain using `skills.lock.json`.
- Introduce `plugin-local-skills.json` whose V1 local skill set contains only `content-harness`.
- Vendor selected content-oriented skills from approved external repositories after license, release, compatibility, and integrity review.
- Use `content-harness` to select and sequence ingestion, research, writing, humanization, translation, formatting, repurposing, detection, and distribution capabilities.
- Keep deterministic state and safety rules outside vendor skills in the runtime kernel.
- Route cover, illustration, infographic, social-image, and other generated-visual requirements to `image-factory-plugin`.
- Reuse channel skills for actual platform interaction while Content Factory remains authoritative for approval, bundle identity, idempotency intent, recovery, and verification.
- Preserve the CF-001 through CF-042 task identifiers and the V1 release gates.

## Vendor Skill Direction

### Baoyu skills selected for Content Factory

Core content pipeline:
- `baoyu-url-to-markdown`
- `baoyu-translate`
- `baoyu-format-markdown`
- `baoyu-markdown-to-html`
- `baoyu-post-to-wechat`

Optional source/distribution capabilities:
- `baoyu-youtube-transcript`
- `baoyu-wechat-summary`
- `baoyu-post-to-weibo`
- `baoyu-post-to-x`

These are candidates for locked vendoring. Inclusion in a release still requires exact release/tag, commit, digest, license, runtime, and compatibility evidence.

### Explicitly excluded from Content Factory

Image/visual generation and rendering skills such as `baoyu-image-gen`, `baoyu-cover-image`, `baoyu-article-illustrator`, `baoyu-xhs-images`, `baoyu-infographic`, `baoyu-comic`, `baoyu-compress-image`, `baoyu-diagram`, and `baoyu-slide-deck` are not vendored into Content Factory. Visual needs are delegated to Image Factory.

`baoyu-danger-gemini-web` is excluded because Content Factory does not need its image/text reverse-engineered backend. `baoyu-danger-x-to-markdown` is not a default dependency because URL ingestion already has an X-capable path and the dangerous variant adds an avoidable consent/risk surface. `baoyu-electron-extract` is outside the product domain.

## Other External Skill Families

Content Factory may also vendor reviewed skills for:
- source-grounded research and long-form writing;
- content strategy, product marketing, copywriting, and copy editing;
- Chinese humanization and author-voice preservation.

No candidate becomes a release dependency until its source and license are verified and it can be locked immutably.

## Non-goals

- Do not build a second Image Factory.
- Do not create local duplicates of mature upstream skills merely to rename them.
- Do not let vendor skills own canonical revision, approval, detection, or delivery state.
- Do not automate public posting without the approved V1 authorization boundary.
- Do not promise a detector score or attempt adversarial detector evasion.
- Do not expand V1 into a SaaS, distributed scheduler, or all-channel publishing platform.

## Impact

The main impact is architectural:
- one local harness instead of many local prompt skills;
- stronger supply-chain requirements;
- smaller plugin-owned prompt surface;
- clearer cross-plugin boundaries;
- lower duplication and easier upstream upgrades.

The V1 product scope and release-quality expectations remain unchanged.
