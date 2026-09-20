# Distribution and Delivery Specification

## Purpose

Use channel-specific execution skills without surrendering Content Factory's approval, idempotency, recovery, and verification semantics.

## Requirements

### Requirement: Channel skills SHALL be execution adapters

Channel skills may perform browser/API interactions but SHALL NOT authoritatively set Content Factory delivery state.

#### Scenario: WeChat adapter returns a draft ID
- **WHEN** the execution adapter returns success
- **THEN** Content Factory records the remote identifier and proceeds to readback verification

### Requirement: Remote mutation SHALL require trusted approval

The approved bundle hash, account, action, and policy version SHALL be bound to a trusted approval before remote mutation.

#### Scenario: Agent text claims approval
- **WHEN** the model submits `approved=true` without a trusted user confirmation channel
- **THEN** the kernel rejects the mutation

### Requirement: Unknown remote result SHALL not be blindly retried

A timeout after possible remote success SHALL enter an unknown state and trigger reconciliation.

#### Scenario: Draft was created but response was lost
- **WHEN** the client cannot determine whether the remote write succeeded
- **THEN** recovery checks the remote state before deciding whether another write is safe

### Requirement: V1 verified remote delivery SHALL focus on WeChat

WeChat draft delivery is the V1 P0 verified remote channel. Weibo and X may be optional packaged capabilities without being release-blocking remote-delivery promises.

#### Scenario: Weibo capability is unavailable
- **WHEN** the user asks for a V1 article workflow that does not require Weibo
- **THEN** V1 core completion is not blocked
