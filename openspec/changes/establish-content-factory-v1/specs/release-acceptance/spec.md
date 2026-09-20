# Release Acceptance Specification

## Purpose

Ensure V1 is labeled usable only when implementation, vendor integrity, real external contracts, recovery, and cross-host evidence all correspond to the same release.

## Requirements

### Requirement: V1 release SHALL include vendor integrity evidence

Release validation SHALL confirm all managed skills match `skills.lock.json` and all plugin-local skills match `plugin-local-skills.json`.

#### Scenario: Vendor digest drifts
- **WHEN** a release candidate contains a changed managed skill
- **THEN** the release gate fails

### Requirement: V1 SHALL preserve the approved business closure

The stable release SHALL cover source ingestion, writing/editing, rendering, real detection, export, verified WeChat draft delivery, and recovery.

#### Scenario: Documentation exists but runtime is missing
- **WHEN** only OpenSpec and README are complete
- **THEN** the project SHALL NOT be labeled v1.0.0 usable

### Requirement: Cross-host support SHALL be evidence-based

Codex, ZCode, and Kimi support claims SHALL be backed by current-version installation and core-flow evidence.

#### Scenario: Manifest exists but host was not run
- **WHEN** a host has only metadata with no runtime evidence
- **THEN** its support state remains NOT_RUN rather than supported

### Requirement: Image Factory SHALL remain an external capability boundary

Release validation SHALL ensure Content Factory does not package a duplicate image-generation backend.

#### Scenario: Image-generation skill appears in Content Factory's vendor lock
- **WHEN** release validation detects a prohibited visual-generation skill
- **THEN** the release gate fails
