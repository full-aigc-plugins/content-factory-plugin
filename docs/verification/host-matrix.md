# Host verification matrix

Content Factory ships distinct manifests for Codex, ZCode, and Kimi. All three
manifests bind the same package identity and managed `skills/` tree. The shared
CLI contract recognizes each host only when the host declares its identity and
reports every capability from an explicit capability manifest.

| Host | Manifest | Package contract | Live host session | External detector | Draft readback | Image capability |
| --- | --- | --- | --- | --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` | Verified offline | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| ZCode | `.zcode-plugin/plugin.json` | Verified offline | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| Kimi | `kimi.plugin.json` | Verified offline | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |

The offline contract starts the same CLI for each declared host, verifies that
the filesystem capability is available only when declared, keeps browser and
image capabilities unavailable when declared unavailable, and performs zero
paid calls. The release build preserves all three manifest byte streams.

Manifest presence is not installation evidence. The authoritative live status
is [live-run-index.json](live-run-index.json); it remains `NOT_RUN` until a new
session on the named host produces material-to-export, detection, and draft
readback evidence. No external provider or content-platform brand is used as a
credential, account, or capability placeholder.
