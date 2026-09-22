# Channel integration acceptance

## ADDED Requirements

### Requirement: CIA-001 Support SHALL be reported by capability
Profile authoring coverage, vendor installation, read access, draft delivery and public publication SHALL have independent support states by host/channel/format/account combination.

#### Scenario: Profile exists without publisher
- **WHEN** a channel has a valid authoring profile but no verified publishing adapter
- **THEN** it may be described as authoring/export capable only after authoring tests pass, not as publishing supported

#### Scenario: Declared host and recipe has no V1 remote-delivery promise
- **WHEN** profile resolution, vendor contract, authoring and working export are verified on the actual host but a remote operation is optional or outside the V1 promise
- **THEN** the host and recipe combination counts as evaluated coverage while the remote operation retains its separate BLOCKED, NOT_RUN or out-of-scope state and is never reported as supported

### Requirement: CIA-002 V1 channel completion SHALL preserve existing release gates
Channel integration SHALL retain CF-001–CF-042, add CF-043–CF-058 and require the new release gate before CF-042 completion. No documentation task SHALL check an implementation task.

#### Scenario: OpenSpec is committed
- **WHEN** these documents are pushed to the repository
- **THEN** implementation and live-validation tasks remain unchecked

### Requirement: CIA-003 Channel quality SHALL be tested with representative evidence
All declared channel/format recipes SHALL pass at least one source-grounded example and one routing/misrouting case. The original 30-document benchmark and live WeChat gates SHALL remain required.

#### Scenario: Native-note output is generic long-form prose
- **WHEN** the Xiaohongshu profile produces an unadapted long article instead of the requested card copy
- **THEN** the channel-format quality test fails even if the text is grammatical

### Requirement: CIA-004 Validation claims SHALL match executed checks
Document structure, official OpenSpec validation, vendor contract tests and live actions SHALL be separate evidence records linked to the relevant revision.

#### Scenario: Official CLI is unavailable
- **WHEN** only a local structural checker has run
- **THEN** official OpenSpec validation remains NOT_RUN and is not described as passing

#### Scenario: Live evidence is recorded after candidate construction
- **WHEN** an immutable candidate package is built from candidate commit C and live evidence is committed later in evidence commit E
- **THEN** the gate verifies that C is an ancestor of E and that every live receipt binds the exact candidate package digest instead of requiring a tracked metadata file to contain E's own commit hash
