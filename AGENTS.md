# Content Factory — repository guidance

Read `openspec/README.md` first. The repository currently contains a design baseline, not a released plugin.

## Active scope

The V1 baseline is `establish-content-factory-v1`. Its channel-awareness completion is `add-platform-aware-content-orchestration`. Read both before implementing the harness. The latter makes content-platform recognition and channel-specific recipes mandatory; host capability discovery alone is insufficient.

## Invariants

- Keep exactly one plugin-local skill: `content-harness`. Channel profiles and recipes are data/reference files, not new local skills.
- Prefer reviewed, immutable vendor skills. A discovered skill is not installed, approved, compatible, or safe merely because a catalog lists it.
- Keep source platform, target channel, execution host, content format, and destination account separate.
- Delegate generated visuals to Image Factory. Video/audio production remains an external capability; a script is not a finished video.
- Kernel services own revisions, facts, consent, budgets, detection validity, delivery intents, recovery, and verification.
- Preserve CF-001 through CF-042 and their original business gates. CF-043 through CF-058 add channel integration; do not mark tasks complete for documentation work.
- Preserve previous planning/history. Do not sync pending changes into canonical specs or publish a runtime version before implementation acceptance.
- Record actual validation. Static document checks, official OpenSpec validation, vendor conformance, and live delivery are different evidence classes.
- Never automatically install candidate skills, disable unrelated skills, suppress provenance, bypass permission checks, or fabricate engagement metrics.

## Complete architecture and execution decomposition

Read `docs/architecture/Content-Factory-Architecture.zh_CN.md` and `openspec/changes/implement-content-factory-architecture/` alongside both existing changes. The third change decomposes the same CF-001–CF-058 parents into 232 execution steps; it is not a new product phase. Preserve the three presentation sections and four text blocks. CF-058 precedes CF-042. Do not roll up parent completion without original acceptance and actual evidence.
