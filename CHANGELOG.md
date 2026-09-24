# Changelog

All notable changes to Content Factory are recorded here.

## [Unreleased]

### Added

- Immutable vendor-skill supply chain and the single local `content-harness`.
- Runtime Kernel for workspaces, revisions, recovery, evidence, approvals, and bounded external actions.
- Source-grounded authoring, editing, formatting, rendering, review, and export contracts.
- 16 channel profiles and 39 explicit native channel-format recipes.
- Codex, ZCode, and Kimi packaging contracts.
- AI content detection and content-platform draft adapter contracts with generic provider aliases.
- A loopback-only Zhuque API Key setup page with owner-only local storage and secret-free CLI/MCP status; this does not validate the API or perform detection.
- R01–R42 offline acceptance coverage and a fail-closed integrated release gate.

### Verification boundary

- Automated test counts are reported by the current CI run rather than frozen here.
- Actual external services, accounts, host sessions, draft readback, and dual-human corpus review remain `NOT_RUN` where recorded.
- The `v1.0.0` release is blocked; no tag, package publication, or marketplace update exists.
