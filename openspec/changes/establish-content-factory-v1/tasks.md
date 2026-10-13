# Content Factory V1 Tasks

> 2026-10-12 过度设计裁剪：删除平台机制范围（CF-011 不可变版本与 CAS 冲突、CF-012 Run/Step 账本与恢复、CF-027/028/029 检测政策/请求去重时效/费用额度取消、CF-032 冻结交付包与受控审批、CF-037 安全供应链专项验证、CF-038 幂等故障回归、CF-040 跨系统安装迁移、CF-041 真实宿主端到端验收、CF-042 发布门禁）及 Task invariants 等流水账段落；未完成任务收敛为实现导向单行；历史见 git 与 docs/evidence/。

## W0 — Supply chain and external contracts

- [x] **CF-001 Immutable skill supply chain and release structure**
  - Create `skills.lock.json` and `plugin-local-skills.json`.
  - Implement vendor sync/check tooling.
  - Verify exact license/provenance for each selected upstream.
  - Pin release/tag + peeled commit SHA + per-skill digest.
  - Reject floating refs, drift, undeclared local skills, and missing licenses.

- [x] **CF-002 Host bootstrap and capability probe**
  - Establish CLI/MCP domain entry points.
  - Detect host, search, browser, credential, and external-plugin capabilities without paid calls.

- [ ] **CF-003 AI detection platform live contract probe**: with an authorized account validate whole-text/segment responses, Unicode behavior, auth and quota; record raw fixtures, with regression tests.

- [ ] **CF-004 WeChat draft permission/readback probe**: with an authorized account verify create/read/update and unknown-result recovery (no public broadcast), with regression tests.

- [x] **CF-005 Vendor formatting parity baseline**
  - Lock and evaluate `baoyu-format-markdown` and `baoyu-markdown-to-html`.
  - Preserve content-freeze semantics.
  - Remove runtime dependence on floating Bun/npm downloads for the packaged release.

- [x] **CF-006 Image Factory collaboration contract**
  - Probe actual Image Factory capability/receipt interface.
  - Define VisualBrief and receipt validation.
  - Confirm Content Factory contains no image-generation backend.

## W1 — Workspace, sources, immutable revisions

- [x] **CF-007 Workspace/object store/SQLite transactions**
- [x] **CF-008 TXT/Markdown source ingestion and deduplication**
- [x] **CF-009 Controlled URL ingestion**
  - Prefer the locked `baoyu-url-to-markdown` capability when available.
  - Keep SSRF, redirects, access walls, prompt injection, size and extraction policy in the kernel.
- [x] **CF-010 DOCX and text-PDF ingestion**

## W2 — Harness-driven creation and editing

- [x] **CF-013 content-harness routing**
  - Create the only plugin-local skill: `content-harness`.
  - Implement full/edit/format/detect/repurpose/deliver routing.
  - Select vendor capability sets by request type.
  - Do not duplicate vendor skills as local skills.

- [x] **CF-014 Author profile and terminology protection**
  - Store versioned author/style constraints.
  - Ensure vendor editors cannot leak sample-specific private facts.

- [x] **CF-015 Research, SourceBundle, and ClaimRegistry**
  - Integrate approved source/research skills.
  - Require source + locator for important verifiable claims.
  - Preserve conflicting evidence.

- [x] **CF-016 Five content templates using vendor writing capabilities**
  - Research analysis.
  - Technical tutorial.
  - Product/update.
  - Customer case.
  - Short/social/script adaptation.
  - Harness chooses source-grounded writing vs marketing/copywriting methods.

- [x] **CF-017 Protected-fact checks and review report**
  - Deterministically guard numbers, units, dates, names, URLs, code, commands, and citation targets.
  - Model review must remain distinguishable from deterministic checks.

- [x] **CF-018 Humanization and copy editing**
  - Integrate reviewed Chinese humanizer/copy-editing skills.
  - Validate resulting revision against protected facts.
  - Keep light/standard/deep modes and bounded iteration.

## W3 — Repurposing, visuals, rendering

- [x] **CF-019 Repurposed content revisions**
  - Use vendor writing methods via harness.
  - Never reuse the parent article's detection report for materially changed derivatives.

- [x] **CF-020 Visual planning and asset records**
  - Harness emits VisualBrief.
  - Track user images, real screenshots, licensed assets, and generated assets distinctly.

- [x] **CF-021 Controlled Image Factory invocation**
  - All generated cover/illustration/infographic/social visuals go through Image Factory.
  - Require receipt/hash/budget evidence.
  - No Baoyu image-generation skill is vendored into Content Factory.

- [x] **CF-022 Deterministic Markdown/HTML channel rendering**
  - Integrate Baoyu formatter/HTML conversion.
  - Freeze substantive text before final render.
  - Channel conversion cannot silently rewrite title, summary, facts, or citations.

- [x] **CF-023 Three themes and mobile layout regression**
- [x] **CF-024 Local review report and revision comparison**

## W4 — Real detection and validity

- [ ] **CF-025 AI content detection platform adapter**: implement the HTTP adapter and report intake, with regression tests.
- [ ] **CF-026 Ratio interpretation and Unicode segment mapping**: implement classification-ratio interpretation with Unicode segment mapping, with regression tests.
- [ ] **CF-030 Complete detection report**: assemble the complete detection report with live sample comparison, with regression tests.

## W5 — Approval, channel execution, verified delivery

- [ ] **CF-031 Account/credential/delivery permission preflight**: implement account/credential resolution and permission preflight (no secrets in output), with regression tests.
- [ ] **CF-033 WeChat channel execution**: reuse locked `baoyu-post-to-wechat` methods and persist submit intent before remote mutation, with regression tests.
- [ ] **CF-034 WeChat readback, conflict detection, and update**: implement draft readback with conflict detection and update, with regression tests.
- [ ] **CF-035 Controlled browser draft path**: reuse channel/browser methods only inside the explicit approval boundary, login/CAPTCHA stays user-controlled, with regression tests.
- [ ] **CF-036 Working/verified portable export**: implement Markdown/HTML/asset export packages to a chosen directory without remote writes, with regression tests.

## W6 — Security, quality, install, release

- [ ] **CF-039 30-document editorial benchmark**: run the 30-document editorial quality benchmark (facts, naturalness, purpose, layout) retaining human judgement, with regression tests.
