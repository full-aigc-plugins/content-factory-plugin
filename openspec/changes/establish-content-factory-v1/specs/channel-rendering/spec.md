# Channel Rendering Specification

## Purpose

Reuse mature formatting/rendering skills while guaranteeing that rendering does not mutate approved substantive content.

## Requirements

### Requirement: Markdown formatting SHALL preserve content

The configured formatting capability SHALL change structure/typography only within the approved formatting policy.

#### Scenario: Approved article enters formatting
- **WHEN** `baoyu-format-markdown` is invoked after text approval
- **THEN** substantive additions/deletions trigger a diff finding instead of being silently accepted

### Requirement: HTML rendering SHALL be deterministic for a frozen input

A frozen channel variant and template version SHALL render reproducibly.

#### Scenario: Same frozen input is rendered twice
- **WHEN** the same text/assets/theme version are used
- **THEN** equivalent rendered content is produced aside from explicitly non-semantic metadata

### Requirement: WeChat conversion SHALL occur before detection freeze when it changes visible text

Link/citation transformations that change visible text SHALL be completed before the exact detector text is frozen.

#### Scenario: External links become bottom citations
- **WHEN** the WeChat renderer rewrites visible references
- **THEN** the resulting visible text becomes the detection input rather than reusing a report for pre-conversion text
