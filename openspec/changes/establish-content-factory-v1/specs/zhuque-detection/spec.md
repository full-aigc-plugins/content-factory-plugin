# Zhuque Detection Specification

## Purpose

Provide real detector integration whose evidence is bound to the exact published text version without misrepresenting detector output as authorship proof.

## ADDED Requirements

### Requirement: Detection SHALL call the real configured provider

The production path SHALL not substitute model self-scoring for Zhuque responses.

#### Scenario: Zhuque credentials are absent
- **WHEN** detection is required for a verified delivery
- **THEN** the workflow is blocked rather than marking detection passed

### Requirement: Detection SHALL bind to exact text

The report SHALL reference the exact normalized/submitted text bytes and hash.

#### Scenario: Visible title changes after detection
- **WHEN** a new channel variant changes the title
- **THEN** the prior report remains historical evidence but no longer satisfies the current variant's detection requirement

### Requirement: Provider fields SHALL retain their semantics

Classification ratios, confidence values, and segment labels SHALL be presented as distinct provider outputs.

#### Scenario: Confidence is returned
- **WHEN** the UI/report renders the response
- **THEN** the confidence value is not relabeled as a universal "AI percentage"

### Requirement: Detection SHALL not become an evasion loop

The system SHALL not automatically rewrite indefinitely to chase a target score.

#### Scenario: Policy is not met after editorial review
- **WHEN** the bounded editing policy is exhausted
- **THEN** the workflow returns to user review with the actual detector evidence
