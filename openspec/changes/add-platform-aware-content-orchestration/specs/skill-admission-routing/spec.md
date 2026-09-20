# Skill admission and runtime routing

## ADDED Requirements

### Requirement: SAR-001 Discovery SHALL remain separate from executable admission
The system SHALL distinguish discovered, source_reviewed, candidate_approved, locked, installed, contract_verified and live_verified states. Catalog ratings, names, badges and descriptions SHALL NOT alone advance admission.

#### Scenario: High-rated candidate without package or license
- **WHEN** a high-scoring SkillHub listing has unresolved source files or license
- **THEN** it remains a candidate and is not installed or selected for execution

### Requirement: SAR-002 Discovery records SHALL expose freshness and coverage
Candidate records SHALL include source namespace/owner/slug, observation time, evidence tier and retrieval limits. Unavailable listing pagination or version data SHALL remain unknown.

#### Scenario: Category page cannot be retrieved
- **WHEN** only indexed detail pages are available
- **THEN** the report discloses partial discovery and does not claim a complete live latest ranking

### Requirement: SAR-003 Immutable provenance SHALL survive repackaging
Admitted skills SHALL satisfy the baseline release/tag, commit and digest rules. Registry-origin candidates SHALL also retain exact original version/artifact/signature provenance; reviewed redistribution SHALL require a verified license and immutable controlled release.

#### Scenario: Registry archive differs from signed payload
- **WHEN** signature or content digest verification fails
- **THEN** admission fails without silently replacing the expected fingerprint

### Requirement: SAR-004 Runtime eligibility SHALL precede preference
Selection SHALL filter by installed integrity, host/runtime, channel/format/locale, output contract, allowed actions, data recipients and budget before method preference. Each overlapping capability SHALL have one primary per context.

#### Scenario: Preferred skill requires an unavailable runtime
- **WHEN** a selected skill depends on an absent Bun, browser or MCP service
- **THEN** the route reports the missing prerequisite or chooses a previously admitted compatible alternate without installing unapproved software

### Requirement: SAR-005 Skill adaptations SHALL remain auditable
Unmodified vendor trees SHALL retain their expected bytes. Modified instructions or scripts SHALL be represented as a reviewed fork/patch with upstream and effective hashes and regression evidence.

#### Scenario: Porting a Bun script
- **WHEN** a script is changed for the approved Node runtime
- **THEN** the effective artifact receives separate patch/hash evidence and is not represented as an untouched upstream release

### Requirement: SAR-006 Skills SHALL NOT escalate control or fabricate engagement
A skill SHALL NOT disable unrelated skills, change the harness authority, grant itself broader data access, or fabricate facts/engagement to optimize a score. Quality assessment SHALL NOT be substituted for security review.

#### Scenario: Discovery skill requests trigger takeover
- **WHEN** a candidate instructs the agent to disable another discovery skill
- **THEN** that behavior fails admission and no unrelated skill is modified

#### Scenario: TRACE assessment skips scanning
- **WHEN** the evaluator marks trust.scan skipped
- **THEN** the report preserves that status and an independent security review remains outstanding
