# Channel integration acceptance and traceability

R01–R42 are mapped to executable offline assertions and the offline suite has run. Live host/channel/account dimensions remain `NOT_RUN`; this document does not promote fixtures, manifests, or offline contracts into live support.

## 1. Concrete cases

| ID | Input/condition | Required observable result |
|---|---|---|
| R01 | YouTube input -> WeChat target | Source stays youtube; channel=wechat-article/article; no YouTube delivery intent. |
| R02 | Codex host -> Xiaohongshu note | Host remains Codex; native-note recipe selected before writing. |
| R03 | Request says only 发微信 | needs_clarification; zero remote calls. |
| R04 | Zhihu answer + selected WeChat account | Conflict retained; no silent target/account replacement. |
| R05 | Twitter target alias | Canonical x; format/locale preserved. |
| R06 | Unknown execution host | host=unknown; no assumed WorkBuddy/Codex capability. |
| R07 | growth, podcast or baidu without destination | Domain/medium/family separated; only accepted working export or clarification. |
| R08 | Same source -> Douyin and TikTok | Distinct profile/account/locale decisions. |
| R09 | No target for a channel-specific production request | No default WeChat publisher; clarify or accept generic export. |
| R10 | WeChat article vs Xiaohongshu carousel vs Douyin script | Different structures and output contracts, not only changed CSS. |
| R11 | Mandatory platform constraint unknown or expired | Affected remote action blocked; working export labeled with limitation. |
| R12 | Format-only request for approved variant | No forced source research, rewriting, detector run or remote write. |
| R13 | Registry wrapper shares a name with an MCP server | Distinct identities and dependencies recorded; no auto-equivalence. |
| R14 | High score but missing license/full package | Candidate remains unadmitted; no installed/compatible claim. |
| R15 | Category/API unavailable; indexed page only | Partial coverage disclosed; no latest whole-category ranking. |
| R16 | Enterprise display title without exact slug | Canonical identity/version stay unknown; no fabricated install command. |
| R17 | Moved tag, digest mismatch or invalid signature | Admission/release check fails without auto-refreshing expected values. |
| R18 | Bun/browser/MCP/wx dependency unavailable | Explicit unavailable or pre-approved compatible alternate; no hidden install. |
| R19 | Two overlapping humanizers installed | Exactly one primary for context; no compulsory double rewriting. |
| R20 | Fallback sends private text to a new service | New consent required; refusal retains existing artifacts. |
| R21 | Candidate disables other skills or requests blanket sandbox removal | Behavior rejected; unrelated configuration unchanged. |
| R22 | Channel authoring profile exists but live adapter not verified | Support says planned/authoring/export as evidenced, never publishing supported. |
| R23 | Read-only acquisition bundle also exposes publish tools | Only authorized read operation eligible; no write capability escalation. |
| R24 | Source includes a distinctive personal anecdote | Not transplanted into the new author’s voice without supporting authorization. |
| R25 | Vendor alleges fixed algorithm weights/engagement multipliers | Unsupported statements excluded from sourced constraints and factual output. |
| R26 | Technical rewrite changes a command, number or unit | Protected-fact diff blocks silent promotion. |
| R27 | No Image Factory available | Text may complete; required visual branch is pending/blocked, not fabricated. |
| R28 | Image-generation skill appears in Content Factory lock | Vendor/release validation rejects duplicate media production. |
| R29 | Script complete; no MP4/audio receipt | Report script/show-notes package, not completed or published media. |
| R30 | Three channel targets from one evidence package | Sibling variants have independent profile/recipe/revision identities. |
| R31 | Title/citation/subtitle text changed after detection | Changed final text invalidates applicable report and downstream approval. |
| R32 | Same bytes reused for another destination account | Storage may reuse; old account consent cannot authorize the new account. |
| R33 | Profile update changes only visual layout | Visual/delivery review invalidated; eligible identical-text evidence handled separately. |
| R34 | One batch branch blocked, another succeeds | Per-variant result and receipt preserved; no false all-success or total reset. |
| R35 | Remote write succeeded but response was lost | unknown; reconcile/read back before retry; no duplicate draft by default. |
| R36 | View counts use different definitions or periods | Definitions/window/denominator preserved; no unsupported normalized comparison. |
| R37 | Missing metric or one successful post | Unknown stays unknown; causal optimization remains an unconfirmed hypothesis. |
| R38 | Comment contains hostile instructions or unnecessary personal data | Untrusted-data handling and minimal disclosure; no instruction execution. |
| R39 | User approves reply wording only | No send/DM/moderation; recipe updates require their own review. |
| R40 | Detector cannot evaluate selected language/input scope | not_evaluable; never fake pass or silently reuse parent report. |
| R41 | Only documents or manifests exist for a host/channel | Implementation/live status remains NOT_RUN, not usable. |
| R42 | New channel gate missing while original CF-042 is attempted | Release gate fails; CF-058 is required without depending on CF-042. |

## 2. Requirements -> tasks

| Capability | Requirement IDs | Responsibility |
|---|---|---|
| platform-context-resolution | CPR-001–004 | CF-044, CF-046 |
| channel-recipe-selection | CRS-001–005 | CF-045, CF-046, CF-050, CF-055 |
| skill-admission-routing | SAR-001–006 | CF-043, CF-047, CF-048, CF-049 |
| multichannel-variant-isolation | MVI-001–005 | CF-051, CF-052, CF-053 |
| content-ops-feedback | COF-001–004 | CF-054 |
| channel-integration-acceptance | CIA-001–004 | CF-056, CF-057, CF-058 |

## 3. Content evaluation

Build an authorized source-grounded example for each declared channel/format in the profile catalog, including audience/goal/locale and expected native output. Human review checks format suitability, factual support, author voice, useful specificity, attribution/disclosure, and absence of invented personal experience. Keep intermediate artifacts and evaluator reasons. Every declared format also needs a misrouting/failure example.

Retain the original 30-document benchmark and WeChat live draft/readback gates. Do not replace them with the count of profiles, the R-case table or catalog scores. A generic essay that fails the requested native format fails the channel test even when spelling and detection results look good.

## 4. Operational evidence matrix

For each tested host/version + OS + plugin commit/package + channel/format/locale + account class, record separately: profile resolution, vendor contract, authoring, working export, authorized source read, draft save/readback, public publish, feedback read and reply draft. Each dimension is VERIFIED / FAILED / BLOCKED / NOT_RUN with evidence refs. Public publishing remains outside this V1 release promise.

No mock is accepted as live external evidence. Missing dependencies/accounts remain NOT_RUN or BLOCKED. Provider pages and historical slugs cannot replace a recorded execution. Store no credentials or private source text in public test reports.

## 5. Document and OpenSpec validation

Check all relative links, requirement/scenario structure, task IDs/dependency cycles, complete 16-channel coverage, non-channel taxonomy, unchecked tasks and evidence labels. Run official CLI separately when available and record its actual version/output:

```bash
openspec status --change add-platform-aware-content-orchestration --json
openspec validate add-platform-aware-content-orchestration --strict
```

OpenSpec 1.8.0 has run both commands successfully for this change. The two related changes are validated separately; strict document validation does not prove live channel, account, host, or content-quality acceptance.
