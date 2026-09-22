# Actual host, channel, and account matrix

Overall status: **PARTIAL — 78/117 host × recipe combinations verified**

Recorded: 2026-09-22
Release candidate: `1.0.0-rc.2` from `33ff3315bbea626fb5428a70e9f445b2b9165bc4`, build-manifest SHA-256 `35e74f6ea0d167ab120d7acd2a89df56e36647addd1116ddf0473dff66d6f447`

Offline contract tests are not live host evidence. The checked-in manifests prove packaging shape only. Separate actual-host receipts now prove all 39 recipes on Codex and ZCode; Kimi remains quota-blocked before a model response.

## Coverage boundary

| Dimension | Codex | ZCode | Kimi |
|---|---|---|---|
| Profile resolution | VERIFIED (39/39) | VERIFIED (39/39) | NOT_RUN — host quota |
| Vendor contract | VERIFIED (39/39) | VERIFIED (39/39) | NOT_RUN — host quota |
| Authoring | VERIFIED (39/39) | VERIFIED (39/39) | NOT_RUN — host quota |
| Working export | VERIFIED (39/39) | VERIFIED (39/39) | NOT_RUN — host quota |
| Authorized source read | NOT_RUN | NOT_RUN | NOT_RUN |
| Draft save | NOT_RUN | NOT_RUN | NOT_RUN |
| Draft readback | NOT_RUN | NOT_RUN | NOT_RUN |
| Feedback read | NOT_RUN | NOT_RUN | NOT_RUN |
| Reply draft | NOT_RUN | NOT_RUN | NOT_RUN |
| Public publish | NOT_RUN | NOT_RUN | NOT_RUN |

78 of 117 declared host × recipe combinations are verified: Codex 39/39 and ZCode 39/39. Kimi remains 0/39 because its model provider returned HTTP 403 before a model response. This is evaluated recipe coverage, not remote publication. The four required dimensions total 312/468 verified; the remaining 156 belong only to Kimi. Remote dimensions retain independent applicability and remain NOT_RUN.

The authoritative actual-host receipt is [host-recipe-acceptance.json](host-recipe-acceptance.json). Every verified run binds the RC source commit, 263-file package manifest digest, 8-skill Vendor contract fingerprint, 39-recipe fixture digest, and per-recipe evidence digest. Temporary working exports were manifest-verified and removed after each run.

No external account alias, credential reference, private content, draft identifier, or remote receipt is recorded. Future remote runs must bind the exact host and version, OS, plugin commit/package digest, channel/format/locale, account class, action, and immutable evidence reference. Evidence from an older version, another account, a mock, or a manifest cannot update remote dimensions.

Public publishing is outside the V1 release promise. Even after draft verification exists, publish remains a distinct unsupported or separately authorized action.
