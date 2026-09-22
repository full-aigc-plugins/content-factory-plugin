# Status and verification guide

Offline verification is not live verification.

Content Factory uses four evidence labels:

- `COMPLETE`: the task's specified behavior and required verification were executed.
- `PARTIAL_OFFLINE`: deterministic code and fixtures passed, but an external service, account, actual host session, or human review was skipped.
- `NOT_RUN`: no qualifying execution evidence exists.
- `BLOCKED`: a gate correctly refused to continue because required evidence is absent or stale.

Run the local engineering baseline with:

```bash
npm run lint
npm run typecheck
npm test
npm run skills:check
npm run audit:release
npm run build
```

Then run the integrated verdict separately:

```bash
npm run release:gate
```

The current integrated verdict is expected to be `BLOCKED` and to exit non-zero. Do not suppress that exit code in a release workflow.

## Evidence that does not count as live

- a plugin manifest or generated distribution;
- a mock, synthetic fixture, or offline contract test;
- a different account, old package, old commit, or historical provider page;
- a successful HTTP status without business success and readback;
- a human-review template without both recorded reviews.

Live evidence must bind the exact host/version, OS, plugin commit and package digest, channel/format/locale, account class, action, and immutable receipt. Provider and authorization names in public evidence use generic aliases such as “AI 内容检测平台” and “内容平台文章账号”; credentials and private content must never be recorded.
