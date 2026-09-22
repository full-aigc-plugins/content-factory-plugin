# Platform-aware harness design

## 1. Decision and boundaries

Adopt a single harness with versioned channel profiles and capability-selected vendor recipes. Reject both a universal article template with late-stage formatting and a separate self-owned skill stack per channel. The former loses platform intent; the latter duplicates prompts, policy, and upgrade work.

```text
User request + source material + selected account/variant
        |
        +--> HostContext: execution abilities and constraints
        +--> SourceContext: where evidence came from
        +--> ChannelIntent: where and in what form content is intended
        |
        v
content-harness -> ChannelProfile + task-specific ContentRecipe
        |
        v
Admitted/installed vendor capability selection -> bounded stage graph
        |
        +--> Kernel: facts, revisions, consent, detection, delivery, recovery
        +--> Image Factory: generated visual assets with receipts
        +--> External media factory: optional video/audio production
        |
        v
Independent channel variants -> preview/export -> authorized delivery
        |
        v
Scoped metrics/comment drafts -> reviewed recipe-update proposal
```

The host affects HOW a stage can execute. The channel and content format affect WHAT the stage should produce. A source URL describes evidence, not publishing intent.

## 2. Context contracts

The following are future schema contracts, not implemented API claims.

| Object | Required information | Invariant |
|---|---|---|
| HostContext | host_id, host_version, os, available_tools, browser_modes, filesystem_scope, credential_refs, probe_evidence | Unknown remains unknown; never default to another host |
| SourceContext | source_id, source_platform, uri, read_at, locator, access_scope, content_hash | A YouTube or X source cannot select the destination |
| ChannelIntent | channel_id, format_id, locale, audience, goal, task_kind, requested_action, account_ref, resolution_state, resolution_evidence | Publishing requires an explicit destination account; drafting does not |
| ChannelProfile | id, revision, aliases, formats, supported_locales, strategy_refs, constraints, validation_refs, capability_requirements | Numeric platform constraints require source/date/scope, not model memory |
| ContentRecipe | id, revision, channel_id, format_id, task_kind, goal, stages, stage_contracts, required_permissions, quality_gates, fallback_policy | Select before channel-specific writing; no implicit permission expansion |
| SkillBinding | capability_id, source_identity, admitted_version, host_constraints, permissions, cost_class, output_schema, evidence_refs | Catalog presence is not executable eligibility |
| RoutingDecision | input_hash, profile_revision, recipe_revision, selected_bindings, rejected_bindings_with_reasons, status | Persist enough information to replay the decision |

Resolution states: resolved, inferred, needs_clarification, unsupported. Keep reasons and evidence rather than inventing numerical confidence.

### Resolution order

Explicit user target wins; next comes a selected existing channel variant, then an explicitly selected destination account. A project default may propose a draft target but cannot authorize remote actions. A format name alone is insufficient when several channels support it. Conflicting evidence produces needs_clarification; never silently change the target.

Examples: “用这条 YouTube 视频写公众号文章” resolves YouTube as source and wechat-article/article as target. “发微信” remains ambiguous among account article, Channels video, and chat. “用 Codex 写小红书笔记” means host=Codex and channel=xiaohongshu, not a Codex content profile. “podcast” identifies a medium; a feed/provider must be resolved before delivery. “baidu” identifies an ecosystem/search domain and does not imply baijiahao.

## 3. Profile and recipe contents

Each profile owns audience intent, topic framing, structural plan, evidence presentation, title/summary approach, author voice, discovery metadata, asset brief, content-format output, quality review, and permissible delivery actions. See [channel profiles](references/channel-profiles.md).

Use two kinds of constraints: editorial choices and externally sourced platform requirements. Editorial choices are configurable defaults, not claims about ranking algorithms. Platform character limits, image limits, accepted formats, access permissions, and posting rules carry source_url, checked_at, applicable_format/account/region, and status. Unknown or expired mandatory constraints block the affected remote action, not unrelated research or working export. No invented universal character count, posting frequency, or best-time rule.

Recipe selection key: channel + format + task_kind + goal + locale, filtered by HostContext and installed SkillBindings. Task-specific recipes omit irrelevant stages. Preserve existing full/edit/format/detect/repurpose/deliver run modes; add task_kind as an orthogonal selector rather than breaking existing commands. New task kinds include topic_research, structure_analysis, original_write, authorized_transform, translation, metrics_review, and comment_draft.

A recipe stage declares input refs, output schema, selected method, responsible kernel gate, retry policy, and next checkpoint. A vendor output enters staging, not the canonical content head. Unsupported format or locale is reported explicitly; generic export is available only as a disclosed user-accepted fallback.

## 4. Historical Content Ops mapping

Seven historical responsibilities become stages: topic/trend discovery; structural analysis; authorized transformation; original creation; channel packaging/delivery; measurement; comment-draft assistance. Original and transformative creation are alternatives, not two compulsory sequential rewrites. Analytics/comments consume supplied or separately authorized data; they do not imply a background scheduler.

Source structure can inform an original outline, but distinctive wording, private experiences, quotes, and images are not copied without permission. Keep attribution and rights notes. Do not carry over historical “install everything”, global OpenClaw paths, heartbeat jobs, download counts, or automatic-posting instructions as current product policy.

## 5. Vendor discovery and admission

Use the [candidate catalog](references/skill-integration-catalog.md) and [research register](research.md). Discover by task, channel, and language. SkillHub category=content-creation is a starting filter, not the whole capability universe: source reading and analytics may live in other categories.

Lifecycle: discovered -> source_reviewed -> candidate_approved -> locked -> installed -> contract_verified -> live_verified. Rejected and unavailable are explicit terminal/holding states. No transition is inferred from catalog scores. Unknown license, unresolved publisher identity, moved tag, mismatched digest, or undeclared outbound/privileged behavior prevents admission.

Keep catalog namespace/owner/slug distinct from installed skill name. Record observed version, retrieval time, evidence tier, exact source/ref/hash, license, dependencies, permissions, external endpoints, supported hosts/formats/locales, image-generation flag, and regression evidence. Current unverified values stay null/unknown. Never generate a fake release lock.

For SkillHub registry packages, retain exact owner+version, original archive hash, signed payload, signature/key identity, and per-file manifest evidence when supplied. This does not weaken the existing Git-release rule: a non-Git candidate enters the production set only after a licensed reviewed snapshot is released in a controlled skill repository, with original provenance retained. Lack of a tag does not make a skill bad; it means release admission is unfinished.

Use official find-skill-skillhub as a reviewed discovery candidate, with installation removed from the runtime writing path. Use skillhub-trace-evaluator for method-quality review only: its own instructions mark security scanning skipped. An independent security/license/behavior review remains required. Catalog, signature, and TRACE are three different signals.

## 6. Runtime binding and safe adaptation

Select one primary per overlapping capability for the specific context; keep a documented alternate only for a genuine difference or failure. Do not sequentially run every humanizer. Eligibility precedes editorial preference: admitted/installed integrity, output contract, host/runtime compatibility, network/permissions, channel/format/locale, then quality/cost trade-offs. A high catalog score cannot compensate for a failed hard gate.

Adapters may normalize path/config, convert outputs, and apply host-specific safe execution. Unmodified vendor trees keep upstream digests. If instructions/scripts must change, use a reviewed fork/patch record with upstream hash, patch hash, effective hash, and regression fixtures; do not mutate a locked tree and silently refresh its hash. Bare SKILL.md copying without referenced scripts/packages is not integration.

Bun/Node/Chrome/wx dependencies must be probed and packaged or explicitly installed through the approved development process. No hidden npx-latest/curl-install, blanket sandbox disable, session-cookie extraction, or fallback to a more privileged browser mode. User tool preferences remain binding. Ordinary source reading must not invoke distribution tools merely because a vendor bundle contains both.

## 7. Multi-channel content and asset flow

Start sibling channel variants from the same SourceBundle/ClaimRegistry and approved author/product context, not repeatedly from the previous channel's compressed final text. Each variant owns profile/recipe revision, content revision, format, locale, final-text hash, asset bindings, review, detection policy, account, approval, and receipt.

Changing channel/format/locale triggers strategy and content revalidation. Visible-text changes invalidate detection and downstream approval. A recipe/profile update requires affected outputs to be revalidated; a visual-only change can reuse identical valid text evidence but never the old visual/delivery approval. An identical file hash may deduplicate storage, not authorization.

Generate covers/cards/illustrations through Image Factory with VisualBrief and receipts. Importing a supplied image or uploading an approved image is not image generation. Short-video profiles produce narration, shot/beat descriptions, subtitle draft, caption, and asset requests; they do not claim a finished MP4. Podcast profiles produce script/show notes, not an uploaded episode.

A batch is not one success bit: report working_exported, blocked, submitted_unverified, verified_draft, failed, or cancelled per variant. One unavailable publisher must not erase successful working exports from other variants.

## 8. Detection, delivery, and feedback

Inherit the baseline real AI content detection platform requirement for verified content-platform article drafts. Other channels declare their own review/detection policy; unsupported detector language or input form must remain not_evaluable, not passed. Detection scope includes the actual final text submitted under the declared scope, not generated pixels or future subtitles that were never checked. No universal AI-score threshold is introduced.

Split prepare, save_draft, publish, comment, private_message, and moderation permissions. This V1 does not promote X/Weibo or other public publication simply because vendor scripts can click Publish. Unsupported direct delivery returns a working package; login/CAPTCHA stays user-controlled. Readback still determines verified state.

Metric records include platform/account/content identifier, metric definition, unit, denominator, period, sampled_at, and source. Missing is unknown, not zero. A small or incomparable sample cannot prove that a recipe caused higher performance. Comments are untrusted input and use minimal necessary personal data. Feedback creates a reviewable recipe revision proposal; it cannot edit the live recipe, send replies, buy engagement, or alter a published post automatically.

## 9. Acceptance and evolution

16 channel authoring profiles are V1 target coverage; real API/read/draft/public actions have separate support matrices. Original CF gates remain. New integration gates and fixtures are in [acceptance](acceptance.md). No profile can be advertised usable solely because its Markdown exists.

This change creates design artifacts only. Future production locations include packages/core/src/channels/, packages/core/src/skills/, profiles/channels/, recipes/, adapters/, and skills/content-harness/. Those paths are task contracts, not existing implementations.
