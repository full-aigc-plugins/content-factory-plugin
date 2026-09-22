# Integrated V1 release gate

Release verdict: **BLOCKED**  
Recorded: 2026-09-22

The integrated gate exists and correctly refuses the current repository state. This package must not be released or published as production-ready while the blockers below remain.

## Current blockers

- CF-057 actual host, channel, and external-account verification is `PARTIAL_OFFLINE`.
- No exact release candidate commit/package has been selected in the live evidence index.
- Live evidence status is `NOT_RUN`.
- 0 of 117 expected host × channel-format combinations have live evidence.

The foundational immutable supply chain, security regression, and three-OS packaging gates are complete. They do not replace live channel evidence. Public publishing remains outside the V1 promise, and the gate never turns a manifest, mock, or offline test into a live receipt.

Run `npm run release:gate` to evaluate the checked-in evidence. A blocked gate exits non-zero by design. The implementation does not depend on the final release task, preventing a circular release dependency.
