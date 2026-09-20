# Runtime Kernel Specification

## Purpose

Define deterministic state, evidence, authorization, and recovery rules that vendor skills cannot bypass.

## Requirements

### Requirement: Canonical revisions SHALL be immutable

Every accepted content modification SHALL create a new revision rather than overwrite historical content.

#### Scenario: Human and agent edit the same base
- **WHEN** both submit candidates against the same expected revision
- **THEN** only a valid CAS update advances the head and the competing edit is preserved for conflict handling

### Requirement: Product states SHALL remain separate

Run completion, editorial approval, detection status, and delivery verification SHALL be independent state dimensions.

#### Scenario: Formatting-only run succeeds
- **WHEN** the requested format task finishes
- **THEN** the run may be succeeded without falsely marking detection or delivery verified

### Requirement: Vendor outputs SHALL pass kernel validation

Vendor skills SHALL return candidates/artifacts that the kernel validates before canonical acceptance.

#### Scenario: Humanizer returns edited content
- **WHEN** protected facts differ unexpectedly
- **THEN** the revision is not silently promoted

### Requirement: Recovery SHALL use durable checkpoints

Completed external operations and validated artifacts SHALL be reusable after restart without unnecessary duplicate calls.

#### Scenario: Process exits after an expensive external step
- **WHEN** a valid receipt/artifact was durably recorded
- **THEN** resume starts from the next valid checkpoint rather than repeating the paid step
