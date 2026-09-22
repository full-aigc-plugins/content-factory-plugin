# Integrated V1 release gate

Release verdict: **BLOCKED**

Recorded: 2026-09-22

The integrated gate exists and correctly refuses the current repository state. This package must not be released or published as production-ready while the blockers below remain.

## Current blockers

- CF-030, CF-035, CF-039, CF-041 and CF-057 still lack their required live or human evidence.
- Immutable candidate `1.0.0-rc.1` is selected at `09de6466ebaeb0ea96bc48eb5ce6553c2365b4db` with build-manifest SHA-256 `f10f9c8b9574a50536215f580c90fb79516f68458c21cedf5abcf2db1626fdd9`; the manifest carries the same source commit.
- Live evidence status is `NOT_RUN`.
- 0 of 117 declared host × channel-format combinations have actual-host evaluation evidence.
- 0 of 468 required profile-resolution, vendor-contract, authoring and working-export capabilities are verified.

The foundational immutable supply chain, security regression, and three-OS packaging gates are complete. They do not replace live channel evidence. Public publishing remains outside the V1 promise, and the gate never turns a manifest, mock, optional remote action, or offline test into a live receipt. Candidate source and later evidence commits are bound by Git ancestry plus the immutable build-manifest digest rather than an impossible self-referential same-commit field.

Run `npm run release:gate` to evaluate the checked-in evidence. A blocked gate exits non-zero by design. The implementation does not depend on the final release task, preventing a circular release dependency.
