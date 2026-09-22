# Platform integration implementation tasks

Status: 13 tasks are `COMPLETE`; CF-053, CF-056, and CF-057 are `PARTIAL_OFFLINE`. This file adds CF-043–CF-058 and does not replace CF-001–CF-042. Checked boxes indicate completed implementation evidence; unchecked boxes retain missing live or human evidence. Read [plan](plan.md), [design](design.md), [candidate catalog](references/skill-integration-catalog.md) and [acceptance](acceptance.md) first.

Each task requires fixtures -> targeted assertions -> implementation -> regression -> evidence -> review. Required receipts identify source/effective hashes, task and code revision, exact command/environment, actual output, and fixture vs live status. No public posting or paid call is authorized merely by this task list.

## 1. CF-043 — Candidate provenance and intake snapshots

- [x] 1.1 Complete CF-043: Candidate provenance and intake snapshots.

**Dependencies:** CF-001.
**Responsibility paths:** `packages/core/src/skills/candidates.ts`, `schemas/skill-candidate.schema.json`, `docs/verification/channel-intake/`.
**Input -> output and required behavior:** SkillHub query/detail evidence and historical leads -> canonical identity/status records; preserve null version/license; distinguish index snapshots from live pages.
**Requirements:** SAR-001, SAR-002, SAR-003. **Cases:** R14, R15, R16, R17.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-043.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/candidate-intake.test.ts
```

## 2. CF-044 — Separate host/source/channel context and resolve ambiguity

- [x] 2.1 Complete CF-044: Separate host/source/channel context and resolve ambiguity.

**Dependencies:** CF-002.
**Responsibility paths:** `packages/core/src/channels/context.ts`, `schemas/channel-intent.schema.json`.
**Input -> output and required behavior:** Request, selected variant/account and host probe -> HostContext/SourceContext/ChannelIntent; source URL and host cannot choose target.
**Requirements:** CPR-001, CPR-002, CPR-003, CPR-004. **Cases:** R01, R02, R03, R04, R05, R06, R07, R08, R09.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-044.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/context.test.ts
```

## 3. CF-045 — Versioned profiles and per-format recipe registry

- [x] 3.1 Complete CF-045: Versioned profiles and per-format recipe registry.

**Dependencies:** CF-044.
**Responsibility paths:** `profiles/channels/`, `recipes/`, `packages/core/src/channels/registry.ts`.
**Input -> output and required behavior:** 16-channel catalog -> versioned profiles and explicit format recipes; growth/podcast/baidu do not become publishers.
**Requirements:** CRS-001, CRS-002, CRS-003, CRS-004. **Cases:** R07, R10, R11, R12.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-045.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/profiles.test.ts
```

## 4. CF-046 — Single-harness platform-aware routing

- [x] 4.1 Complete CF-046: Single-harness platform-aware routing.

**Dependencies:** CF-013, CF-044, CF-045.
**Responsibility paths:** `skills/content-harness/SKILL.md`, `skills/content-harness/references/`, `packages/core/src/channels/select-recipe.ts`.
**Input -> output and required behavior:** Resolved context -> stage graph and RoutingDecision with selected/rejected bindings; preserve existing run modes and add task_kind.
**Requirements:** CPR-004, CRS-001, CRS-002, CRS-004. **Cases:** R02, R08, R10, R11, R12.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-046.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/harness-routing.test.ts
```

## 5. CF-047 — Shared vendor integration and semantic adaptation

- [x] 5.1 Complete CF-047: Shared vendor integration and semantic adaptation.

**Dependencies:** CF-005, CF-015, CF-018, CF-043.
**Responsibility paths:** `skills.lock.json`, `vendor/`, `adapters/content-methods/`, `tests/fixtures/vendor-content/`.
**Input -> output and required behavior:** Approved exact source packages -> complete installed methods; resolve social/product-marketing aliases; scripts/references/dependencies retained; patches separately hashed.
**Requirements:** SAR-003, SAR-004, SAR-005, SAR-006. **Cases:** R13, R17, R18, R19, R20, R21.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-047.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/vendor-methods.test.ts
```

## 6. CF-048 — Channel-specialized candidate conformance

- [x] 6.1 Complete CF-048: Channel-specialized candidate conformance.

**Dependencies:** CF-043, CF-044, CF-047.
**Responsibility paths:** `adapters/channel-sources/`, `docs/verification/channel-candidates/`.
**Input -> output and required behavior:** Historical/current leads -> reviewed primary/alternate bindings per capability; distinguish MCP server from wrapper, acquisition from publishing, account article from video.
**Requirements:** SAR-001, SAR-004, SAR-006. **Cases:** R13, R18, R22, R23.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-048.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/channel-candidates.test.ts
```

## 7. CF-049 — Runtime eligibility, progressive loading and fallback

- [x] 7.1 Complete CF-049: Runtime eligibility, progressive loading and fallback.

**Dependencies:** CF-046, CF-047, CF-048.
**Responsibility paths:** `packages/core/src/skills/select-binding.ts`, `packages/core/src/skills/eligibility.ts`.
**Input -> output and required behavior:** Installed integrity + context/permissions/budget -> one primary with reasons; no automatic install or privilege expansion.
**Requirements:** SAR-004, SAR-005, SAR-006. **Cases:** R18, R19, R20, R21, R23.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-049.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/skill-routing.test.ts
```

## 8. CF-050 — Channel-native source-grounded writing and editing

- [x] 8.1 Complete CF-050: Channel-native source-grounded writing and editing.

**Dependencies:** CF-016, CF-019, CF-045, CF-049.
**Responsibility paths:** `recipes/`, `tests/fixtures/channel-writing/`, `docs/verification/channel-editorial/`.
**Input -> output and required behavior:** Shared claims -> native article/note/thread/answer/script output; preserve facts and terminology, not source anecdotes or private author facts.
**Requirements:** CRS-001, CRS-005, CIA-003. **Cases:** R10, R24, R25, R26.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-050.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/native-writing.test.ts
```

## 9. CF-051 — Channel-format media briefs and external receipts

- [x] 9.1 Complete CF-051: Channel-format media briefs and external receipts.

**Dependencies:** CF-021, CF-050.
**Responsibility paths:** `adapters/image-factory/`, `schemas/media-brief.schema.json`, `packages/core/src/channels/assets.ts`.
**Input -> output and required behavior:** Card/cover/script needs -> explicit external VisualBrief/media brief and receipts; no generated visual skills in vendor lock.
**Requirements:** MVI-003, CRS-004. **Cases:** R27, R28, R29.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-051.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/media-boundary.test.ts
```

## 10. CF-052 — Sibling variants and dependent evidence invalidation

- [x] 10.1 Complete CF-052: Sibling variants and dependent evidence invalidation.

**Dependencies:** CF-011, CF-028, CF-032, CF-050, CF-051.
**Responsibility paths:** `packages/core/src/content/channel-variants.ts`, `packages/core/src/review/channel-validity.ts`.
**Input -> output and required behavior:** SourceBundle + target list -> independent revisions/hashes/reports; changing channel/locale/text invalidates affected approvals.
**Requirements:** MVI-001, MVI-002, MVI-004, MVI-005. **Cases:** R30, R31, R32, R33, R34.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-052.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/variant-isolation.test.ts
```

## 11. CF-053 — Per-action channel delivery capabilities

- [ ] 11.1 Complete CF-053: Per-action channel delivery capabilities.

**Dependencies:** CF-034, CF-035, CF-036, CF-052.
**Responsibility paths:** `packages/core/src/delivery/capabilities.ts`, `adapters/wechat/`, `docs/verification/channel-support/`.
**Input -> output and required behavior:** Target account/format/action + approval -> allowed draft or blocked/export path; readback and unknown-write reconciliation retained.
**Requirements:** MVI-002, MVI-004, CIA-001. **Cases:** R03, R04, R22, R23, R32, R34, R35.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-053.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/delivery-capabilities.test.ts
```

## 12. CF-054 — Metrics and comment-draft feedback

- [x] 12.1 Complete CF-054: Metrics and comment-draft feedback.

**Dependencies:** CF-044, CF-049, CF-052.
**Responsibility paths:** `packages/core/src/channels/feedback.ts`, `schemas/channel-metric.schema.json`, `schemas/comment-draft.schema.json`.
**Input -> output and required behavior:** Authorized observations -> attributed metric report/reply drafts and proposed recipe revision; never sends or auto-updates recipes.
**Requirements:** COF-001, COF-002, COF-003, COF-004. **Cases:** R36, R37, R38, R39.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-054.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/feedback.test.ts
```

## 13. CF-055 — Sourced platform constraints and detector applicability

- [x] 13.1 Complete CF-055: Sourced platform constraints and detector applicability.

**Dependencies:** CF-027, CF-045, CF-049.
**Responsibility paths:** `packages/core/src/channels/constraints.ts`, `packages/core/src/detection/applicability.ts`.
**Input -> output and required behavior:** Dated scoped constraints + exact final text -> evaluable policy or explicit unknown/blocked; no folklore multipliers or universal score.
**Requirements:** CRS-003, MVI-002. **Cases:** R11, R25, R31, R40.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-055.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/constraints.test.ts
```

## 14. CF-056 — Routing corpus, adversarial inputs and native quality

- [ ] 14.1 Complete CF-056: Routing corpus, adversarial inputs and native quality.

**Dependencies:** CF-038, CF-039, CF-050, CF-051, CF-052, CF-053, CF-054, CF-055.
**Responsibility paths:** `tests/channels/`, `tests/fixtures/channel-writing/`, `docs/verification/channel-regression/`.
**Input -> output and required behavior:** Run all R01–R42 and every declared channel/format example; retain original 30-document benchmark, privacy and factual gates.
**Requirements:** CIA-001, CIA-002, CIA-003, CIA-004. **Cases:** R01–R42.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-056.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/channel-acceptance.test.ts
```

## 15. CF-057 — Actual host/channel/account verification

- [ ] 15.1 Complete CF-057: Actual host/channel/account verification.

**Dependencies:** CF-041, CF-056.
**Responsibility paths:** `docs/verification/channel-host-matrix.md`, `docs/verification/channel-live-index.json`.
**Input -> output and required behavior:** Exact release candidate on actual hosts -> separate read/author/export/draft evidence; unsupported combinations stay NOT_RUN.
**Requirements:** CIA-001, CIA-002, CIA-003, CIA-004. **Cases:** R22, R34, R35, R41.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-057.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/host-channel-contract.test.ts
```

## 16. CF-058 — Integrated V1 release evidence gate

- [x] 16.1 Complete CF-058: Integrated V1 release evidence gate.

**Dependencies:** CF-001, CF-037, CF-040, CF-057.
**Responsibility paths:** `scripts/release-gate.mjs`, `docs/verification/channel-release.md`.
**Input -> output and required behavior:** Base P0 + new channel evidence -> release verdict bound to same commit/package; CF-042 requires this gate, never the reverse.
**Requirements:** CIA-001, CIA-002, CIA-003, CIA-004. **Cases:** R14, R17, R28, R41, R42.
**Acceptance:** listed case assertions pass; unsupported capabilities and missing external evidence stay blocked/NOT_RUN; no bypass of baseline consent, fact or revision rules.
**Evidence:** `docs/verification/tasks/CF-058.json` with the targeted result and adjacent regression.

Verification entry:

```bash
npm run test -- tests/channels/channel-release.test.ts
```
