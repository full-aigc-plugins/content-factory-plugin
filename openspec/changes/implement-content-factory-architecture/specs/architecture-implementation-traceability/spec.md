# architecture-implementation-traceability

## ADDED Requirements

### Requirement: AIT-001 Architecture SHALL preserve the approved presentation

The architecture SHALL contain all three approved sections and four text blocks inline, including the non-bypass and target-state notes.

#### Scenario: Reader opens the architecture
- **WHEN** the architecture is rendered
- **THEN** all three complete sections and the four complete text blocks are present

#### Scenario: A diagram loses a node
- **WHEN** a preserved text block is shortened
- **THEN** the preservation check fails

### Requirement: AIT-002 Task decomposition SHALL preserve parent identity

The implementation plan SHALL map exactly CF-001 through CF-058 to explicit child tasks without dropping original requirements.

#### Scenario: Executor selects a parent
- **WHEN** CF-044 is opened
- **THEN** its inputs, outputs, files, dependencies, counterexample and verification path are available

#### Scenario: A parent is missing
- **WHEN** one CF parent has no child task
- **THEN** coverage validation fails

### Requirement: AIT-003 Dependencies SHALL be acyclic and enforce release ordering

The effective graph SHALL retain required dependencies and require CF-058 before CF-042 without a reverse edge.

#### Scenario: Release order is checked
- **WHEN** the execution graph is sorted
- **THEN** CF-057 precedes CF-058 and CF-058 precedes CF-042

#### Scenario: A release cycle appears
- **WHEN** CF-058 is made dependent on CF-042
- **THEN** graph validation fails

### Requirement: AIT-004 Profiles SHALL cover each declared format explicitly

Every one of the 16 channel profiles SHALL map every declared channel-format pair to an explicit recipe and evidence state.

#### Scenario: Registry coverage is tested
- **WHEN** all 39 declared channel-format pairs are inspected
- **THEN** each has an explicit recipe or is honestly blocked before being advertised usable

#### Scenario: A format is missing
- **WHEN** a profile exists but its declared format has no recipe
- **THEN** coverage cannot be reported complete

