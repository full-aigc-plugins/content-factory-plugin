# Add a local Zhuque credential setup page

## Why

The current detector adapter accepts a credential reference, but the installed user has no built-in way to configure the Tencent EdgeOne Makers API Key. Asking users to export a shell variable is particularly confusing in a desktop host, where the existing app process does not inherit a new terminal's environment.

## What Changes

- Add a temporary, loopback-only setup page, opened by a Content Factory CLI command, following Stitch Design's local-first setup pattern without copying its Google-specific auth flow.
- Store the key in a restricted current-user configuration file and resolve it through the existing detector `SecretProvider` contract. An explicit process `ZHUQUE_API_KEY` remains the higher-priority override.
- Show secret-free configuration status. A saved key is **not** a verified key, an authenticated API response, or a passed AI-content detection.
- Package the setup assets and test the browser, filesystem, and disclosure boundaries.

## Scope and Non-goals

This change configures a credential; it does not submit article text, run a paid or quota-consuming API probe, bypass website CAPTCHA, or promote CF-025/CF-030 live acceptance. The existing Zhuque detection and exact-text evidence requirements remain authoritative.

## Impact

`packages/cli/`, `adapters/zhuque/`, `assets/zhuque-setup/`, build packaging, tests, and user documentation. No new plugin-local Skill, host installation, or marketplace release is included.
