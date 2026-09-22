# Actual host, channel, and account matrix

Overall status: **NOT_RUN**

Recorded: 2026-09-22
Release candidate: `1.0.0-rc.1` from `8ab9a1d11a0a89bbf4ca1050d13af5ce50122bf6`, build-manifest SHA-256 `bc5b8abe77b39d350c5d382e9aa059d0d793968b94b2268378c1de9b11591512`

Offline contract tests are not live host evidence. The checked-in Codex, ZCode, and Kimi manifests prove packaging shape only; they do not prove that this exact package was installed and executed in a real session.

## Coverage boundary

| Dimension | Codex | ZCode | Kimi |
|---|---|---|---|
| Profile resolution | NOT_RUN | NOT_RUN | NOT_RUN |
| Vendor contract | NOT_RUN | NOT_RUN | NOT_RUN |
| Authoring | NOT_RUN | NOT_RUN | NOT_RUN |
| Working export | NOT_RUN | NOT_RUN | NOT_RUN |
| Authorized source read | NOT_RUN | NOT_RUN | NOT_RUN |
| Draft save | NOT_RUN | NOT_RUN | NOT_RUN |
| Draft readback | NOT_RUN | NOT_RUN | NOT_RUN |
| Feedback read | NOT_RUN | NOT_RUN | NOT_RUN |
| Reply draft | NOT_RUN | NOT_RUN | NOT_RUN |
| Public publish | NOT_RUN | NOT_RUN | NOT_RUN |

117 declared host × recipe combinations: NOT_RUN. This is evaluated recipe coverage, not 117 remote publications. Each combination requires actual-host profile resolution, vendor-contract, authoring and working-export evidence; remote dimensions retain independent applicability and status.

No external account alias, credential reference, private content, draft identifier, or remote receipt is recorded. A future live run must bind the exact host and version, OS, plugin commit/package digest, channel/format/locale, account class, action, and immutable evidence reference. Evidence from an older version, another account, a mock, or a manifest cannot update this matrix.

Public publishing is outside the V1 release promise. Even after draft verification exists, publish remains a distinct unsupported or separately authorized action.
