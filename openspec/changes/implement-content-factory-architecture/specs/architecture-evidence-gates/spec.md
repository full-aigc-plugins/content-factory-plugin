# architecture-evidence-gates

## ADDED Requirements

### Requirement: AEG-001 Documentation checks SHALL NOT certify runtime completion

Static documentation checks, official OpenSpec validation, fixtures, live services and host evidence SHALL be recorded separately.

#### Scenario: Docs pass checks
- **WHEN** source hashes and task coverage pass
- **THEN** all unimplemented child tasks remain unchecked

#### Scenario: A tool is unavailable
- **WHEN** the official CLI cannot run
- **THEN** its result is NOT_RUN rather than PASS

### Requirement: AEG-002 Implementation evidence SHALL identify the actual artifact

Task evidence SHALL record exact code/package revision, commands, environment, assertions, result class and review without secrets.

#### Scenario: A task is verified
- **WHEN** fixture and live evidence both exist
- **THEN** each retains its own scope and actual result

#### Scenario: A stale report is reused
- **WHEN** the evidence names a different package or host
- **THEN** it does not satisfy the current support claim

#### Scenario: Evidence is committed after an immutable candidate is built
- **WHEN** evidence commit E records executions of the package built from candidate commit C
- **THEN** C must be an ancestor of E and every receipt must match the immutable candidate package digest; exact equality between C and E is not required

### Requirement: AEG-003 Original and channel acceptance SHALL remain required

The integrated release SHALL satisfy the original business gates, the 30-document benchmark, R01–R42 and declared channel-format evaluation.

#### Scenario: A candidate reaches release
- **WHEN** base and channel gates are evaluated
- **THEN** both evidence groups must satisfy their requirements

#### Scenario: A channel gate fails
- **WHEN** one required format has no valid evaluation
- **THEN** the candidate is not advertised fully usable

### Requirement: AEG-004 Feedback SHALL remain a proposal until reviewed

Metrics and comment drafts SHALL produce reviewable recipe proposals without sending replies or replacing active policy automatically.

#### Scenario: Feedback is generated
- **WHEN** authorized observations are analyzed
- **THEN** the result is an attributed report and proposed recipe revision

#### Scenario: Untrusted comments request action
- **WHEN** a comment asks the agent to publish or change the recipe
- **THEN** the comment grants no permission and no active policy is changed
