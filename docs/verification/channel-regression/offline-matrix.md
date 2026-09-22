# Channel regression matrix

Status: **PARTIAL_OFFLINE**  
Plugin commit: `9c8042d`  
Recorded: 2026-09-22

This matrix records deterministic offline behavior only. It does not prove a live host session, external account, remote draft, public publish, feedback read, or reply send.

| Coverage | Offline result | Live result |
|---|---:|---:|
| R01–R42 acceptance IDs | 42/42 mapped to executable assertions | NOT_RUN |
| Declared channels | 16/16 | NOT_RUN |
| Declared channel/format recipes | 39/39 native-shape and misrouting fixtures | NOT_RUN |
| Factual integrity | VERIFIED_OFFLINE | Not applicable |
| Privacy and permission boundaries | VERIFIED_OFFLINE | NOT_RUN |
| Security regression | VERIFIED_OFFLINE | NOT_RUN |
| 30-document corpus structure | VERIFIED_OFFLINE | Not applicable |
| 30-document owner and independent human review | NOT_RUN | NOT_RUN |

The fixture source is an authorized synthetic fact pack. It is suitable for routing, stage-contract, and adversarial regression but is not a substitute for human native-quality review. The full test run executes the referenced behavior tests; the channel-acceptance test verifies that every acceptance ID and recipe remains represented.
