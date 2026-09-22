# Content-platform article action support

The content-platform article route declares capabilities per adapter and action.
No declaration implies another action, account, format, or adjacent channel.

| Adapter alias | Channel | Formats | Declared actions | Live status |
| --- | --- | --- | --- | --- |
| Content-platform article API | `wechat-article` | `article`, `image_text` | save draft | NOT_RUN |
| Content-platform article browser | `wechat-article` | `article`, `image_text` | save draft | NOT_RUN |
| Content-platform article readback | `wechat-article` | `article`, `image_text` | read draft | NOT_RUN |

Local export is a core operation and does not use a remote channel adapter.
Publish is not declared. The adjacent video channel is not declared. A remote
draft requires a capability whose contract and live binding are both verified,
plus a trusted human approval bound to the exact channel, format, account,
action, adapter, and bundle. Draft success retains readback and unknown-write
reconciliation requirements.

Because the user chose to skip live external validation, all three remote
adapter bindings remain `NOT_RUN`. The implementation falls back to a working
local export and does not reinterpret manifest presence or synthetic tests as
live authorization.
