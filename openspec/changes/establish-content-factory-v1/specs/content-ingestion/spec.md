# Content Ingestion Specification

## Purpose

Normalize authorized external and local source material into traceable, untrusted SourceRecords for downstream research and writing.

## ADDED Requirements

### Requirement: URL ingestion SHALL preserve source identity

URL ingestion SHALL record URI, read time, extracted representation, content hash, and locator metadata.

#### Scenario: Web page is converted by a vendor skill
- **WHEN** `baoyu-url-to-markdown` produces Markdown
- **THEN** Content Factory stores the result as source material with provenance rather than treating it as trusted instructions

### Requirement: External instructions SHALL remain data

Instructions embedded in pages, transcripts, or chats SHALL NOT grant tool permissions.

#### Scenario: Article says to expose secrets
- **WHEN** fetched content contains an instruction to reveal credentials
- **THEN** the instruction remains quoted source text and no credential action is authorized

### Requirement: Optional high-privilege ingestion SHALL require explicit prerequisites

WeChat chat-summary ingestion SHALL remain disabled unless its local dependency, data access, and privacy preconditions are satisfied.

#### Scenario: wx-cli is unavailable
- **WHEN** the harness considers `baoyu-wechat-summary`
- **THEN** the capability is marked unavailable rather than auto-installed

### Requirement: Video transcripts SHALL be source records

YouTube transcript extraction may supply source text but SHALL preserve transcript metadata and language context.

#### Scenario: Transcript is translated before writing
- **WHEN** the transcript is translated into the article language
- **THEN** the translated text retains a relationship to the original transcript source
