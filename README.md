# Content Factory

> A content production, review, and delivery plugin that turns real source material into publishable content.

**English** | [简体中文](README.zh-CN.md)

## Current implementation status

Content Factory is now in active implementation; it is no longer a documentation-only repository.

| Task | Status | Evidence |
|---|---|---|
| CF-001 | COMPLETE | Immutable vendor-skill supply chain, local-harness protection, sync/check entrypoints |
| CF-002 | COMPLETE | CLI/MCP bootstrap, Codex/ZCode/Kimi host probing, lint/typecheck/build/CI gates |
| CF-005 | IN_PROGRESS | Baoyu v1.63.0 formatting skills are locked and vendored; formal task evidence is not yet closed |
| Remaining CF-003–CF-058 | NOT_STARTED / dependency-blocked | Implemented according to the OpenSpec dependency graph |

The current main branch already contains runtime code, tests, CI, the single local `content-harness`, the immutable skill vendor mechanism, and the first Baoyu formatting vendor baseline.

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
```

`npm run skills:check` performs offline integrity validation. `npm run skills:check:upstream` additionally resolves pinned upstream tags.

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

## Current vendor baseline

`skills.lock.json` currently pins:

- `full-aigc-skills/baoyu-skills@v1.63.0`
- commit `c1e1526c84fd07d71d9d12e9845dceeb366d1b42`
- `baoyu-format-markdown`
- `baoyu-markdown-to-html`
- MIT license provenance

Visual-generation Baoyu skills remain outside Content Factory and belong to Image Factory.

## Next work

The dependency graph currently allows CF-003, CF-004, CF-006, CF-007, CF-043, and CF-044 to proceed. Closing CF-005 evidence unlocks its downstream formatting/vendor tasks.

A stable `v1.0.0` will only be published after the base P0 gates, platform-aware routing, real host verification, real detection, verified WeChat draft read-back, and the integrated release gate all pass.
