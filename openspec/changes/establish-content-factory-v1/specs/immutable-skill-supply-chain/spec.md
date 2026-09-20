# Immutable Skill Supply Chain Specification

## Purpose

Ensure every external skill packaged with Content Factory comes from an immutable, reviewable, license-verified source while protecting the plugin-local harness from vendor synchronization.

## Requirements

### Requirement: External skills SHALL be immutable and verifiable

Every managed external skill SHALL be locked by source repository, immutable release/tag, peeled commit SHA, and content digest.

#### Scenario: Locked skill matches the recorded source
- **WHEN** the integrity check runs against a packaged skill
- **THEN** the source ref, resolved commit, and content digest match the lock entry

#### Scenario: Upstream tag moves
- **WHEN** a previously recorded tag resolves to a different commit
- **THEN** the integrity check fails and does not rewrite the lock automatically

#### Scenario: Vendored skill content is modified
- **WHEN** packaged files differ from the recorded digest
- **THEN** release validation fails and identifies the affected skill

### Requirement: Floating branches SHALL NOT be release dependencies

Release packaging SHALL reject dependencies pinned only to `main`, `master`, or another movable branch.

#### Scenario: Candidate source has no immutable release
- **WHEN** a useful skill exists only on a floating branch
- **THEN** it remains a candidate and is not packaged as a release dependency

### Requirement: License and provenance SHALL be recorded

Each managed source SHALL have explicit license/provenance evidence before vendoring.

#### Scenario: License evidence is missing
- **WHEN** sync is requested for a candidate without verified license evidence
- **THEN** sync is blocked before files are added to the release set

### Requirement: Plugin-local skills SHALL be explicit

`plugin-local-skills.json` SHALL declare Content Factory's locally owned skills.

#### Scenario: V1 local skill manifest is validated
- **WHEN** the V1 skill manifest is checked
- **THEN** `content-harness` is the only required plugin-local skill

#### Scenario: Undeclared local skill appears
- **WHEN** `skills/` contains a skill that is neither locked vendor content nor declared local content
- **THEN** integrity validation fails

### Requirement: Vendor updates SHALL preserve local skills

Vendor synchronization SHALL never overwrite declared plugin-local skills.

#### Scenario: Vendor source contains a conflicting directory name
- **WHEN** sync would overwrite `content-harness`
- **THEN** the sync fails without modifying the local harness
