# Visual Asset Delegation Specification

## Purpose

Keep Content Factory focused on content orchestration and delegate generated visual production to Image Factory.

## ADDED Requirements

### Requirement: Content Factory SHALL NOT vendor image-generation skills

Content Factory release dependencies SHALL exclude image-generation, cover-generation, infographic-generation, comic-generation, and social-image-generation skills.

#### Scenario: Baoyu vendor set is synchronized
- **WHEN** the Content Factory allowlist is applied
- **THEN** `baoyu-image-gen`, `baoyu-cover-image`, `baoyu-article-illustrator`, `baoyu-xhs-images`, `baoyu-infographic`, and `baoyu-comic` are not imported

### Requirement: Generated visuals SHALL be requested through Image Factory

The harness SHALL translate content needs into a VisualBrief and submit it to an available Image Factory capability.

#### Scenario: Article needs a cover
- **WHEN** the user authorizes cover generation
- **THEN** Content Factory emits a VisualBrief and accepts only an Image Factory result with usable receipt/hash evidence

### Requirement: Text production SHALL degrade gracefully without image generation

Image unavailability SHALL not prevent text-only production where visuals are not mandatory.

#### Scenario: Image Factory is offline
- **WHEN** the article can still be delivered as a working text draft
- **THEN** the workflow reports the missing asset and continues within the requested scope
