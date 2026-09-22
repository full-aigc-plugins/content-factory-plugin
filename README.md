# Content Factory

> A content production, review, and delivery plugin that turns real source material into publishable content.

**English** | [简体中文](README.zh-CN.md)

## Current implementation status

Content Factory has a working offline runtime and a fail-closed release gate. It is not yet a production release.

| Task | Status | Evidence |
|---|---|---|
| CF-001–002, 005–024, 037–038, 040, 043–052, 054–055, 058 | COMPLETE | Supply chain, Runtime Kernel, harness, import/edit/render/export, routing, recovery, security, and fail-closed release gate |
| CF-003–004 | PARTIAL_OFFLINE | One sanitized AI content detector website observation is recorded; the authenticated API contract and content-platform account probe remain `NOT_RUN` |
| CF-025–036, 039, 041, 053, 056–057 | PARTIAL_OFFLINE | Offline contracts pass; real services, accounts, host sessions, or human review remain `NOT_RUN` |
| v1.0.0 release | **BLOCKED** | Release requires an immutable candidate plus complete live evidence; current details are maintained outside the package in `docs/verification/` |

The current baseline has a cross-platform automated regression suite, 16 channel profiles, 39 explicit channel-format recipes, three host manifests, immutable vendor skills, and one plugin-local `content-harness`. The exact test count is reported by the current CI run rather than frozen in documentation. Offline verification is not live verification.

## Verify the current baseline

Node.js 24+ is required:

```bash
npm install --ignore-scripts
npm run lint
npm run typecheck
npm test
npm run skills:check
npm run build
npm run doctor
npm run release:gate
```

`npm run skills:check` performs offline integrity validation. `npm run skills:check:upstream` additionally resolves pinned upstream tags. `npm run release:gate` currently exits non-zero by design and lists the missing live evidence.

## Architecture

```text
HostContext + SourceContext + ChannelIntent
                    |
                    v
             content-harness
                    |
          ChannelProfile/Recipe
                    |
         admitted Vendor Skills
                    |
                    v
              Runtime Kernel
       revision / fact / approval
       detection / delivery / recovery
                    |
          +---------+---------+
          v                   v
    Image Factory        channel adapters
```

Key invariants:

- `content-harness` is the only plugin-local Skill.
- Research, writing, translation, editing, and formatting prefer reviewed immutable vendor skills.
- Generated images are delegated to Image Factory.
- Host, source platform, and target content channel are independent contexts.
- Remote delivery requires explicit account/action approval and read-back verification.

## Documentation

- [Complete architecture](docs/architecture/Content-Factory-Architecture.zh_CN.md)
- [OpenSpec entry point](openspec/README.md)
- [CF-001–CF-058 implementation tasks](openspec/changes/implement-content-factory-architecture/tasks.md)
- [Implementation plan](openspec/changes/implement-content-factory-architecture/plan.md)
- [Traceability](openspec/changes/implement-content-factory-architecture/traceability.md)
- [Task evidence](docs/verification/tasks/)
- [Verification status guide](docs/guides/status-and-verification.md)
- [Blocked release candidate](docs/verification/release-candidate.json)
- [Integrated release result](docs/verification/channel-release.md)

## Current vendor baseline

`skills.lock.json` currently pins:

- `full-aigc-skills/baoyu-skills@v1.63.0`
- commit `c1e1526c84fd07d71d9d12e9845dceeb366d1b42`
- `baoyu-format-markdown`
- `baoyu-markdown-to-html`
- MIT license provenance

Visual-generation Baoyu skills remain outside Content Factory and belong to Image Factory.

## Release boundary

No `v1.0.0` tag, release, package publication, or marketplace update has been created. The remaining gates require authorized external accounts, actual Codex/ZCode/Kimi sessions, three-sample authenticated AI content detection API evidence, content-platform draft save/readback, and the 30-document dual-human review. Until those checks bind to one exact commit and package digest, the release remains **BLOCKED**.
