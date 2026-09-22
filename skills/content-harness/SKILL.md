---
name: content-harness
description: Content Factory's single plugin-local orchestration skill. Resolve the requested task mode first, preserve supplied context, route only the stages needed for that mode, and leave canonical state/approval/delivery authority to the Runtime Kernel.
---

# Content Harness

Content Harness is the only plugin-local Skill. Vendor synchronization MUST NOT overwrite this directory.

## Responsibilities

1. Identify the requested run mode: `full`, `edit`, `format`, `detect`, `repurpose`, or `deliver`.
2. Preserve topic, sources, channel, locale, audience, goal, content revision and account references already supplied.
3. Resolve HostContext, SourceContext and ChannelIntent independently, then select a versioned ChannelProfile and ContentRecipe before channel-specific authoring. See [platform routing](references/platform-routing.md).
4. Produce a `ContentBrief` plus a bounded stage DAG using the runtime dispatcher.
5. Report genuinely missing inputs. Never invent facts, accounts, sources, preferences, approval, detection results or delivery state.
6. Hand candidate outputs to Runtime Kernel validation. A Skill cannot promote its own output to canonical state.

## Mode routes

| Mode | Required stages |
|---|---|
| full | brief → research → outline → write → fact-check → edit → visual-plan → format → review |
| edit | edit → fact-check → review |
| format | format → review |
| detect | detect → review |
| repurpose | repurpose → fact-check → format → review |
| deliver | delivery-preflight → approval → deliver → delivery-verify |

A simple request MUST NOT be inflated into the full pipeline. In particular, `format` does not authorize research, rewriting, paid detection or remote delivery.

## Missing-input policy

- `full`: require at least a topic or source reference.
- `edit`, `format`, `detect`, `repurpose`: require a content revision/reference.
- `deliver`: require content, channel and destination account.
- Missing inputs are returned in `missingInputs`; `assumptions` remains empty unless the user explicitly approved an assumption.

## Authority boundary

The harness may choose methods and request stages, but the Runtime Kernel owns:
- immutable revisions and conflicts;
- claims and fact guards;
- budgets and credentials;
- AI content detection platform validity;
- trusted approval;
- delivery intent, recovery and readback verification.

Generated visual production is delegated to Image Factory. Channel/profile-aware strategy selection is added by CF-043–CF-050 without creating additional plugin-local Skills.
