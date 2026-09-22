# Integrated V1 release gate

Release verdict: **BLOCKED**

Recorded: 2026-09-22

The integrated gate exists and correctly refuses the current repository state. This package must not be released or published as production-ready while the blockers below remain.

## Current blockers

- CF-030, CF-035, CF-039, CF-041 and CF-057 still lack their required live or human evidence.
- Immutable candidate `1.0.0-rc.2` is selected at `33ff3315bbea626fb5428a70e9f445b2b9165bc4` with build-manifest SHA-256 `35e74f6ea0d167ab120d7acd2a89df56e36647addd1116ddf0473dff66d6f447`; the manifest carries the same source commit.
- Live evidence status is `PARTIAL`.
- 78 of 117 declared host × channel-format combinations have actual-host evaluation evidence: all 39 recipes on Codex and ZCode.
- 312 of 468 required profile-resolution, vendor-contract, authoring and working-export capabilities are verified; Kimi accounts for all 156 remaining NOT_RUN capabilities because its model provider returned HTTP 403 before a response.

The foundational immutable supply chain, security regression, and three-OS packaging gates are complete. They do not replace live channel evidence. Public publishing remains outside the V1 promise, and the gate never turns a manifest, mock, optional remote action, or offline test into a live receipt. Candidate source and later evidence commits are bound by Git ancestry plus the immutable build-manifest digest rather than an impossible self-referential same-commit field.

Run `npm run release:gate` to evaluate the checked-in evidence. A blocked gate exits non-zero by design. The implementation does not depend on the final release task, preventing a circular release dependency.
