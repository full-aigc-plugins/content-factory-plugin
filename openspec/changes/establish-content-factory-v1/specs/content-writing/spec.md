# Content Writing Specification

## Purpose

Use reviewed external writing methods while preserving source grounding, content-type intent, and Content Factory's evidence model.

## ADDED Requirements

### Requirement: Writing method SHALL match content intent

The harness SHALL choose a reviewed writing method appropriate to research analysis, technical tutorial, product/update, customer case, or short/social/script content.

#### Scenario: Technical tutorial is requested
- **WHEN** sources include code and commands
- **THEN** the selected writing path preserves technical artifacts and does not replace them with marketing copy

#### Scenario: Product launch article is requested
- **WHEN** the brief is promotional/product-oriented
- **THEN** the harness may select product-marketing/copywriting methods while still enforcing claim evidence

### Requirement: Verifiable claims SHALL link to evidence

Important externally verifiable claims SHALL reference SourceRecords/locators or be explicitly classified as user assertions/unverified.

#### Scenario: Source support is missing
- **WHEN** a requested customer outcome has no supporting material
- **THEN** the article marks the information as missing rather than inventing a metric

### Requirement: Translation SHALL preserve meaning and protected facts

Translation may use a reviewed vendor translation skill but the accepted revision SHALL pass protected-fact checks.

#### Scenario: Translation changes a numeric value
- **WHEN** the translated candidate changes a protected number
- **THEN** the candidate is rejected or requires explicit correction before becoming the current revision
