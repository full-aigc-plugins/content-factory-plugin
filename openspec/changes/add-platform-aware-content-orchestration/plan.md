# Platform-aware Content Factory implementation plan

**Goal:** complete the V1 harness with channel-native content strategies and evidence-based skill integration without adding another local harness or media backend.

**Architecture:** independent host/source/destination context; versioned profiles and recipes; immutable admitted vendor bindings; kernel-enforced variant, consent and delivery state.

**Tech stack:** the existing planned TypeScript / Node.js 24 LTS / SQLite / CLI + MCP baseline. No runtime dependency is installed by this document change.

**Spec:** [design.md](design.md), the six capability deltas in specs/, and the pending [base V1 design](../establish-content-factory-v1/design.md).

## 1. Baseline bridge

Keep CF-001–CF-042 intact. The new CF-043–CF-058 work is additive. CF-042's release decision must additionally require CF-058; CF-058 never depends on CF-042, avoiding a release cycle. Do not interpret the earlier 42-task list alone as sufficient after this completion is adopted.

| Existing work | Required channel extension |
|---|---|
| CF-001 / CF-002 | candidate evidence and host/channel identity are separate; CF-043/044 |
| CF-013 | resolve ChannelIntent and recipe before language work; CF-045/046 |
| CF-014–019 | channel-aware vendor binding, native outputs and editorial guards; CF-047–050 |
| CF-020–024 | format-specific briefs and variant rendering, not a second image engine; CF-051/052 |
| CF-025–030 | detector scope/locale, text validity and current constraints; CF-052/055 |
| CF-031–036 | per-channel/account action capabilities and working-export fallback; CF-053 |
| CF-037–041 | hostile skill inputs, routing cases and separate host/channel evidence; CF-056/057 |
| CF-042 | new coverage and admission evidence required through CF-058 |

## 2. Ordered workstreams

1. Resolve candidate identity/provenance and context schemas (CF-043/044).
2. Define 16 profiles, format recipes and routing (CF-045/046).
3. Admit shared methods and specialized alternatives; implement compatible bindings (CF-047–049).
4. Verify channel-native writing, media briefs and variant isolation (CF-050–052).
5. Complete bounded delivery, feedback and sourced constraint handling (CF-053–055).
6. Run regression, actual host/account checks and release evidence review (CF-056–058).

CF-043 and CF-044 can proceed independently after their base prerequisites. No parallel worker may independently change shared ChannelIntent/SkillBinding/ChannelVariant schemas without one coordinating owner. Candidate research may be parallelized; lockfile or recipe-head changes are reviewed and serialized.

## 3. Quality levels

- Authoring/export: each declared channel/format recipe passes native-output, fact, source, style and routing cases. All 16 channel profiles are coverage targets; untested formats stay planned.
- Installed capability: exact vendor source, effective bytes, references/dependencies and host execution contracts verified. No installed claim from a catalog entry.
- Live operation: read/draft/public actions verified separately with actual host, plugin version, account class, format, permission and return/readback evidence. Public publishing is not promoted by this V1 plan.

One representative default format per profile is insufficient to claim all alternative formats verified. Test every declared format before advertising it; coverage can be recorded at format granularity without inventing support.

## 4. Task execution and evidence

Each task in [tasks](tasks.md) names responsibility paths, dependencies and one exact future test entry. Establish its fixtures and expected failures first, implement the behavior, run the same entry plus adjacent regression, and save a task receipt with revision, runtime, command, exit status, fixture/live distinction and artifact hashes. Source/credential unavailability is blocked or NOT_RUN, not a passing test.

Test commands use `npm run test -- <entry>` only after CF-002 establishes that script. These are future implementation commands, not commands currently supported by the documentation-only repository. Do not claim a missing-command failure as a business-test RED.

## 5. Review focus and rollback

Review source-vs-target ambiguity; WeChat account-vs-video confusion; unknown host; duplicate/mixed-privilege skills; mutable imports; final text/approval invalidation; generated media vs script status; metric definitions and comment injection. The concrete acceptance corpus is in [acceptance](acceptance.md).

Rollback a profile/recipe by creating a new reviewed revision pointing to previous content; retain routing and delivery history. A vendor rollback uses a known locked release and reruns affected fixtures. Never delete evidence or overwrite a remote draft merely because the local profile changed.
