# Channel integration acceptance

## ADDED Requirements

### Requirement: CIA-001 Support SHALL be reported by capability
Profile authoring coverage, vendor installation, read access, draft delivery and public publication SHALL have independent support states by host/channel/format/account combination.

#### Scenario: Profile exists without publisher
- **WHEN** a channel has a valid authoring profile but no verified publishing adapter
- **THEN** it may be described as authoring/export capable only after authoring tests pass, not as publishing supported

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
