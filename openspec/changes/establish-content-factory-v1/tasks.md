# Content Factory V1 Tasks

All tasks remain NOT_STARTED until implementation evidence exists. Task IDs are preserved from the approved V1 plan.

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

- [ ] **CF-003 Zhuque live contract probe**
  - Validate whole-text/segment responses, Unicode behavior, auth, quota, and raw evidence using an authorized account.

- [ ] **CF-004 WeChat draft permission/readback probe**
  - Verify create/read/update and unknown-result recovery with an authorized account.
  - Do not test public broadcast.

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
- [ ] **CF-009 Controlled URL ingestion**
  - Prefer the locked `baoyu-url-to-markdown` capability when available.
  - Keep SSRF, redirects, access walls, prompt injection, size and extraction policy in the kernel.
- [ ] **CF-010 DOCX and text-PDF ingestion**
- [x] **CF-011 Immutable revisions, diffs, and CAS conflict handling**
- [ ] **CF-012 Run/Step ledger and recovery**

## W2 — Harness-driven creation and editing

- [ ] **CF-013 content-harness routing**
  - Create the only plugin-local skill: `content-harness`.
  - Implement full/edit/format/detect/repurpose/deliver routing.
  - Select vendor capability sets by request type.
  - Do not duplicate vendor skills as local skills.

- [ ] **CF-014 Author profile and terminology protection**
  - Store versioned author/style constraints.
  - Ensure vendor editors cannot leak sample-specific private facts.

- [ ] **CF-015 Research, SourceBundle, and ClaimRegistry**
  - Integrate approved source/research skills.
  - Require source + locator for important verifiable claims.
  - Preserve conflicting evidence.

- [ ] **CF-016 Five content templates using vendor writing capabilities**
  - Research analysis.
  - Technical tutorial.
  - Product/update.
  - Customer case.
  - Short/social/script adaptation.
  - Harness chooses source-grounded writing vs marketing/copywriting methods.

- [ ] **CF-017 Protected-fact checks and review report**
  - Deterministically guard numbers, units, dates, names, URLs, code, commands, and citation targets.
  - Model review must remain distinguishable from deterministic checks.

- [ ] **CF-018 Humanization and copy editing**
  - Integrate reviewed Chinese humanizer/copy-editing skills.
  - Validate resulting revision against protected facts.
  - Keep light/standard/deep modes and bounded iteration.

## W3 — Repurposing, visuals, rendering

- [ ] **CF-019 Repurposed content revisions**
  - Use vendor writing methods via harness.
  - Never reuse the parent article's detection report for materially changed derivatives.

- [ ] **CF-020 Visual planning and asset records**
  - Harness emits VisualBrief.
  - Track user images, real screenshots, licensed assets, and generated assets distinctly.

- [ ] **CF-021 Controlled Image Factory invocation**
  - All generated cover/illustration/infographic/social visuals go through Image Factory.
  - Require receipt/hash/budget evidence.
  - No Baoyu image-generation skill is vendored into Content Factory.

- [ ] **CF-022 Deterministic Markdown/HTML channel rendering**
  - Integrate Baoyu formatter/HTML conversion.
  - Freeze substantive text before final render.
  - Channel conversion cannot silently rewrite title, summary, facts, or citations.

- [ ] **CF-023 Three themes and mobile layout regression**
- [ ] **CF-024 Local review report and revision comparison**

## W4 — Real detection and validity

- [ ] **CF-025 Zhuque adapter and raw evidence storage**
- [ ] **CF-026 Ratio interpretation and Unicode segment mapping**
- [ ] **CF-027 Detection policy and human exception semantics**
- [ ] **CF-028 Detection invalidation, request deduplication, and freshness**
- [ ] **CF-029 Quota, bounded retry, usage, and cancellation**
- [ ] **CF-030 Complete detection report and live sample comparison**

## W5 — Approval, channel execution, verified delivery

- [ ] **CF-031 Account/credential/delivery permission preflight**
- [ ] **CF-032 Frozen delivery bundle and trusted approval**
- [ ] **CF-033 WeChat channel execution**
  - Reuse locked `baoyu-post-to-wechat` implementation/methods where compatible.
  - Kernel persists intent before remote mutation.
  - Channel skill result cannot directly set verified state.

- [ ] **CF-034 WeChat readback, conflict detection, and update**
- [ ] **CF-035 Controlled browser draft path**
  - Reuse channel/browser methods only inside the explicit approval boundary.
  - Login/CAPTCHA remains user-controlled.
- [ ] **CF-036 Working/verified portable export**

Optional packaged distribution skills `baoyu-post-to-weibo` and `baoyu-post-to-x` may be integrated behind harness routing, but their remote delivery is not a V1 P0 promise unless separately promoted into acceptance gates.

## W6 — Security, quality, install, release

- [ ] **CF-037 Security/privacy/supply-chain validation**
  - Include vendor drift, malicious skill content, secret leakage, URL attacks, approval forgery, and wrong-account delivery.

- [ ] **CF-038 Crash/duplicate/dependency failure regression**
- [ ] **CF-039 30-document editorial benchmark**
- [ ] **CF-040 macOS/Windows/Linux clean install and migration**
- [ ] **CF-041 Codex/ZCode/Kimi real-host end-to-end acceptance**
- [ ] **CF-042 Release bundle, marketplace registration, documentation, and final gate**
  - Same commit/tag/package/market metadata.
  - Vendor integrity check passes.
  - Only actual release evidence may mark V1 complete.

## Task invariants

- Planning completion never checks an implementation box.
- Vendor skills are dependencies, not authorities over canonical product state.
- Image generation is externalized to Image Factory.
- WeChat is the V1 verified remote delivery channel.
- Real service evidence and fixture evidence are stored separately.
