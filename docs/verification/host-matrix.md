# Host verification matrix

Content Factory ships distinct manifests for Codex, ZCode, and Kimi. All three
manifests bind the same package identity and managed `skills/` tree. The shared
CLI contract recognizes each host only when the host declares its identity and
reports every capability from an explicit capability manifest.

| Host | Manifest | Package contract | Runtime preflight | Source-skill session | Installed plugin session | External detector | Draft readback | Image capability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` | Verified offline | OBSERVED: CLI 0.153.4 | PASSED: CLI 0.153.4 | VERIFIED: `1.0.0-rc.2` | NOT_RUN | NOT_RUN | NOT_RUN |
| ZCode | `.zcode-plugin/plugin.json` | Verified offline | OBSERVED: desktop 3.14.3 | PASSED: CLI 0.16.9 | VERIFIED: `1.0.0-rc.2` | NOT_RUN | NOT_RUN | NOT_RUN |
| Kimi | `kimi.plugin.json` | Verified offline | OBSERVED: CLI 0.43.1; desktop 3.2.11 | BLOCKED_HOST_QUOTA | INSTALLED; SESSION BLOCKED_HOST_QUOTA | NOT_RUN | NOT_RUN | NOT_RUN |

The offline contract starts the same CLI for each declared host, verifies that
the filesystem capability is available only when declared, keeps browser and
image capabilities unavailable when declared unavailable, and performs zero
paid calls. The release build preserves all three manifest byte streams.

Manifest presence is not installation evidence. The separate
[installed-session evidence](host-installed-session.json) binds Codex and
ZCode read-only sessions, plus the quota-blocked Kimi attempt, to candidate
`1.0.0-rc.2`. The authoritative recipe and account status remains
[live-run-index.json](live-run-index.json); material-to-export, detection, and
draft readback are still `NOT_RUN`. No provider or content-platform brand is
used as a credential, account, or capability placeholder.

The separate [source-session evidence](host-source-session.json) records
read-only Codex and ZCode CLI sessions against the checked-in
`content-harness`, plus one Kimi session attempt blocked by host quota. Both
successful sessions selected only `format → review`, reported missing inputs,
made no business-service call, and wrote no file. Those historical source-only
runs remain distinct from the later installed-candidate sessions.

The read-only [host runtime preflight](host-runtime-preflight.json) records only
locally observed runtime versions and operating-system metadata. It started no
plugin session, accessed no account, and made no paid or remote call. Runtime
presence therefore does not imply that Content Factory is installed or works
inside that host.
