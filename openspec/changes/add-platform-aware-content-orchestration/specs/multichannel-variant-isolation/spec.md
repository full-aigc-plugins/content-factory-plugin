# Multi-channel variant isolation

## ADDED Requirements

### Requirement: MVI-001 Channel variants SHALL be independent descendants
Multi-channel variants SHALL derive from shared evidence and approved context with distinct content/profile/recipe/format/locale identities, not from a mandatory sequence of progressively compressed channel copies.

#### Scenario: Three targets from one source package
- **WHEN** WeChat, Xiaohongshu and Douyin outputs are requested
- **THEN** three sibling variants are tracked with separate authoring and review results

### Requirement: MVI-002 Detection and consent SHALL bind to actual outputs
Final-text detection, asset approvals and delivery approval SHALL bind to the applicable variant, final text/bundle hash, account and action. Changed visible text SHALL invalidate downstream evidence as defined by the baseline.

#### Scenario: Article becomes a script
- **WHEN** an approved article is adapted into spoken text
- **THEN** the article's detector report and account approval do not automatically authorize the script

#### Scenario: Identical file reused for a second account
- **WHEN** a stored artifact hash is reused for another account
- **THEN** storage may deduplicate but account/action consent is obtained independently

### Requirement: MVI-003 Media boundaries SHALL be explicit
Generated images SHALL use Image Factory. Video/audio rendering SHALL remain an external capability, with distinct script, asset and final-media receipts.

#### Scenario: Video script exists without media output
- **WHEN** a script and shot plan are complete but no video artifact exists
- **THEN** the result is described as a script package, not a completed video or uploaded post

### Requirement: MVI-004 Batch status SHALL preserve partial results
A multi-channel run SHALL report per-variant state and recovery position without equating working export, saved draft and public publication.

#### Scenario: One publisher is unavailable
- **WHEN** a WeChat draft is verified but another channel lacks an approved adapter
- **THEN** the verified result is retained and the other branch is exported or blocked with its own reason

### Requirement: MVI-005 Profile updates SHALL trigger dependency review
A changed profile/recipe SHALL cause affected outputs to be revalidated. Matching text may retain eligible historical detection, but changed assets or delivery scope SHALL require fresh appropriate approval.

#### Scenario: New profile changes visible citations
- **WHEN** a profile update changes the rendered citation text
- **THEN** the new variant's text hash and detection/approval validity are recomputed
