# Zhuque Local Setup

## ADDED Requirements

### Requirement: Content Factory SHALL offer a local credential setup page

The user SHALL be able to open a bundled setup page from the Content Factory CLI without installing a second plugin or editing a shell profile.

#### Scenario: User opens setup
- **WHEN** the user invokes the Zhuque setup command
- **THEN** a temporary server listens only on `127.0.0.1` and serves packaged assets without external requests

### Requirement: Setup SHALL save and resolve a user-owned secret

The setup SHALL write the key to a restricted current-user store, and the detector secret provider SHALL prefer an explicitly supplied `ZHUQUE_API_KEY` process environment value over the stored value.

#### Scenario: User saves a key
- **WHEN** a valid key is submitted from the local page
- **THEN** the key is atomically stored with owner-only Unix permissions and is neither logged nor returned in a response

#### Scenario: Process environment overrides stored key
- **WHEN** both sources have a key
- **THEN** the detector provider resolves the process value for `AI_CONTENT_DETECTOR_PRIMARY` and refuses unrelated credential references

### Requirement: Setup SHALL reject cross-origin and forged writes

The setup server SHALL reject any write that fails its local-origin, request-token, content-type, or size checks.

#### Scenario: A nonlocal page submits a key
- **WHEN** Origin, Host, CSRF, Content-Type, or body limit is invalid
- **THEN** the request is rejected without changing the stored key

### Requirement: Configuration status SHALL remain distinct from detection validity

Configuration status SHALL never be promoted to an authenticated provider result or an AI-content detection result.

#### Scenario: Key is present but never used against the API
- **WHEN** the user checks configuration status
- **THEN** the response reveals only presence and source and says API validity and content detection remain unverified
