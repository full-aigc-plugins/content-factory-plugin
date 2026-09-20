# Content operations feedback

## ADDED Requirements

### Requirement: COF-001 Historical operating roles SHALL be task stages
Monitoring, breakdown, original or authorized transformative writing, packaging/delivery, measurement and comment drafting SHALL be composable stages under one harness, not mandatory permanent agents for every channel.

#### Scenario: User only asks for topic research
- **WHEN** the requested task is topic research
- **THEN** the route ends with an evidence-backed topic report and does not create or publish a post

### Requirement: COF-002 Metric comparisons SHALL preserve meaning
Metrics SHALL retain platform/account/content identity, definition, unit, denominator, observation window and provenance. Unknown values SHALL NOT become zeros; cross-platform counts SHALL NOT be treated as directly comparable without a justified mapping.

#### Scenario: Incompatible view metrics
- **WHEN** two platforms report differently defined view counts
- **THEN** the comparison explains the difference instead of declaring a normalized performance winner

### Requirement: COF-003 Feedback SHALL propose reversible changes
Observed content performance MAY produce a proposed recipe revision with evidence, scope and review. It SHALL NOT silently change active recipes or claim causation from inadequate observations.

#### Scenario: One post performs well
- **WHEN** only one successful post is observed
- **THEN** the system records a tentative hypothesis rather than a guaranteed algorithm rule

### Requirement: COF-004 Comment and community work SHALL respect action boundaries
Comments SHALL be treated as untrusted source data. Drafting replies SHALL NOT authorize sending, private messaging, deleting, moderating or manufacturing engagement. Task execution SHALL NOT implicitly create background schedules.

#### Scenario: Comment requests secret disclosure
- **WHEN** a fetched comment includes an instruction to reveal a token
- **THEN** it is processed only as data and no token or private source is disclosed

#### Scenario: Reply drafts are approved as writing
- **WHEN** a user approves the wording of a reply draft but has not approved a send action
- **THEN** the draft remains unsent
