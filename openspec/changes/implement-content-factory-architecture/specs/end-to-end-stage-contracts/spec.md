# end-to-end-stage-contracts

## ADDED Requirements

### Requirement: ESC-001 Context resolution SHALL precede channel authoring

The composed flow SHALL separate host, source and destination and select a versioned profile and recipe before native writing.

#### Scenario: Cross-platform request is resolved
- **WHEN** a Codex request uses YouTube material to write a Xiaohongshu note
- **THEN** the host, source and target remain distinct

#### Scenario: Destination is ambiguous
- **WHEN** the request says send to WeChat without a destination form
- **THEN** remote delivery is blocked until resolved

### Requirement: ESC-002 All stages SHALL respect kernel authority

External methods SHALL return staged artifacts and evidence; the kernel SHALL validate facts, revisions, permissions and budgets before canonical promotion.

#### Scenario: A vendor returns a candidate
- **WHEN** candidate schema and facts are checked
- **THEN** only a valid expected-revision update advances the head

#### Scenario: Vendor claims approval
- **WHEN** a method returns approved=true without trusted user evidence
- **THEN** no remote mutation is authorized

### Requirement: ESC-003 Media delegation SHALL preserve request and variant identity

Generated visuals SHALL use Image Factory; receipts SHALL bind the originating request and variant, and scripts SHALL not be labeled finished video.

#### Scenario: A valid cover is received
- **WHEN** request identity, file existence and hash match
- **THEN** the asset can bind to the requesting variant

#### Scenario: A stale receipt arrives
- **WHEN** the receipt belongs to a previous variant
- **THEN** it cannot silently attach to the current approved bundle

### Requirement: ESC-004 Delivery SHALL revalidate authorization and reconcile unknown outcomes

Delivery SHALL bind final bundle, account and action to trusted approval and SHALL reconcile possibly successful writes before retry.

#### Scenario: A draft is saved
- **WHEN** the adapter returns a remote identifier
- **THEN** the kernel verifies remote content before reporting verified_draft

#### Scenario: The response is lost
- **WHEN** the remote operation may already have succeeded
- **THEN** status is unknown and retry is reconcile_first

