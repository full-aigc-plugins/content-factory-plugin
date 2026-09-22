# Content Harness Orchestration Specification

## Purpose

Define Content Factory's single plugin-local orchestration skill and keep canonical product state in deterministic services rather than prompt logic.

## ADDED Requirements

### Requirement: Content Factory SHALL have one plugin-local harness

V1 SHALL maintain `content-harness` as the plugin-local orchestration skill and SHALL prefer reviewed vendor skills for reusable content methods.

#### Scenario: Research article is requested
- **WHEN** the user provides sources and asks for an article
- **THEN** the harness selects ingestion/research/writing capabilities without requiring local duplicate research/write skills

### Requirement: Harness routing SHALL be task-specific

The harness SHALL distinguish full, edit, format, detect, repurpose, and deliver modes.

#### Scenario: User asks only for formatting
- **WHEN** the input is already approved text and the requested mode is format
- **THEN** the harness does not force research, rewriting, detection, or remote delivery

### Requirement: Harness SHALL respect deterministic gates

The harness SHALL not create canonical approval, verified delivery, detector pass, or revision state by assertion.

#### Scenario: Channel skill reports success
- **WHEN** a channel execution skill says a draft was saved
- **THEN** the harness submits the result to runtime verification and does not label it verified until readback succeeds

### Requirement: Harness SHALL use explicit capability discovery

The harness SHALL test availability before choosing optional vendor skills or external plugins.

#### Scenario: Image Factory is unavailable
- **WHEN** an article requests illustrations but Image Factory capability is unavailable
- **THEN** the text workflow may continue and the missing visual requirement is reported explicitly

### Requirement: Risky alternatives SHALL NOT be selected silently

The harness SHALL not silently switch to reverse-engineered or higher-privilege providers.

#### Scenario: Default URL ingestion fails for X
- **WHEN** the safe/default path cannot extract the content
- **THEN** the harness does not automatically invoke `baoyu-danger-x-to-markdown`
