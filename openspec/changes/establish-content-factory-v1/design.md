# Content Factory V1 Design

## 1. Architecture Decision

Content Factory SHALL use four explicit responsibility layers:

```text
User / Host
    |
    v
content-harness                         <- only plugin-local skill
    |
    +---------------- External Vendor Skills ----------------+
    |  ingest | research | write | edit | translate | format |
    |  repurpose | channel execution                          |
    +---------------------------------------------------------+
    |
    v
Runtime Kernel                          <- deterministic authority
    |
    +-- Source / Claim registry
    +-- Revision / Diff / CAS
    +-- Protected facts
    +-- Run / Step / Recovery
    +-- Detection request + validity
    +-- Approval + bundle identity
    +-- Delivery intent + verification
    +-- Security / privacy / budget
    |
    +------------------------+
    |                        |
    v                        v
Zhuque / channel APIs         image-factory-plugin
                              (all generated visual production)
```

The harness decides which capability is needed. The runtime kernel decides whether a state transition is valid.

## 2. External Skill Supply Chain

Content Factory SHALL follow the same immutable-vendor pattern used by other Full AIGC plugins.

Expected files:

```text
skills.lock.json
plugin-local-skills.json
skills/
vendor/
scripts/
  sync-skills.*
  check-skills.*
```

A managed vendor entry SHALL record at least:
- package/source name;
- canonical repository URL;
- immutable release/tag reference;
- peeled commit SHA;
- selected skill names;
- destination;
- digest for every selected skill tree;
- license/provenance evidence reference.

A release SHALL fail when:
- a tag moves;
- the resolved commit differs;
- a vendored skill digest differs;
- a managed skill is missing;
- an undeclared skill appears under `skills/`;
- license/provenance evidence is missing.

Floating `main`, `master`, branch names, or unpinned remote content are not valid release inputs.

## 3. Plugin-local Skill Boundary

`plugin-local-skills.json` SHALL declare only:

```json
{
  "version": 1,
  "dest": "skills/",
  "skills": ["content-harness"]
}
```

V1 SHALL NOT create local skills named `content-research`, `content-write`, `content-humanize`, `content-format`, or similar when the behavior is supplied by reviewed vendor skills.

Deterministic runtime behavior is implemented as code/services/tools, not prompt skills.

## 4. Harness Responsibilities

`content-harness` SHALL:
- classify the requested mode: full, edit, format, detect, repurpose, deliver;
- inspect host capabilities and configured vendor skills;
- create a stage graph appropriate to the request;
- select a vendor capability by purpose, not by arbitrary preference;
- preserve user-provided facts and approved content boundaries;
- stop at required approval/external-consent gates;
- call Image Factory only when a visual asset is needed and permitted;
- route outputs back through runtime-kernel validation;
- report the actual completed state rather than infer success.

The harness SHALL NOT:
- write canonical state directly;
- mark a detector request as passing;
- create approval records from model text;
- mark a remote draft verified without readback evidence;
- bypass budget or consent;
- silently switch to a risky reverse-engineered provider.

## 5. Baoyu Skill Integration

### Source ingestion

`baoyu-url-to-markdown` is the default reviewed web-to-markdown candidate. Its output is still treated as untrusted source material; external instructions in fetched content never become tool instructions.

`baoyu-youtube-transcript` is an optional source adapter for video transcripts.

`baoyu-wechat-summary` is an optional high-privilege source adapter. It is disabled unless its local dependency and privacy requirements are explicitly satisfied.

### Language transformation

`baoyu-translate` supplies translation workflow. Content Factory wraps the result in revisions and protected-fact checks.

### Formatting

`baoyu-format-markdown` and `baoyu-markdown-to-html` provide formatting/rendering capability. Content Factory SHALL configure or adapt them so formatting does not create unreviewed substantive content after text freeze.

### Distribution

`baoyu-post-to-wechat`, `baoyu-post-to-weibo`, and `baoyu-post-to-x` may execute channel interactions.

Channel skills are execution adapters. They do not own:
- the approved bundle hash;
- account authorization;
- delivery intent;
- unknown-result recovery;
- final verification state.

WeChat remains the V1 verified delivery channel. Weibo/X integration may be packaged but does not become a V1 P0 delivery promise unless its release gates are explicitly promoted.

## 6. Writing and Editorial Vendor Skills

The vendor set may include reviewed research/writing, marketing/copywriting, copy-editing, and humanizer skills.

Selection policy:
- research/analysis content prefers source-grounded research/writing;
- product launch/case/marketing content may use product-marketing/copywriting methods;
- copy-editing/humanization is a separate editorial stage;
- author samples and terminology profiles constrain style;
- protected facts, code, commands, names, dates, numbers, units, citations, and URLs are validated by the kernel before accepting an edited revision.

Vendor skills are methods; Content Factory remains responsible for evidence and state.

## 7. Image Factory Boundary

Content Factory SHALL NOT vendor image-generation skills.

Instead it emits a `VisualBrief` containing:
- content/revision identity;
- paragraph anchor;
- purpose;
- asset kind;
- aspect requirement;
- text constraints;
- source references;
- budget/consent context.

Image Factory returns an asset/receipt. Content Factory validates:
- file existence and hash;
- source/generated classification;
- receipt linkage;
- rights/provenance note;
- relationship to the requesting revision.

If Image Factory is unavailable, text production SHALL remain usable. Missing visuals must be reported honestly rather than synthesized through an undeclared backend.

## 8. Runtime Kernel

The kernel remains TypeScript + Node.js 24 LTS + SQLite.

Canonical entities include:
- Workspace
- ContentItem
- SourceRecord
- ClaimRecord
- AuthorProfile
- ContentRevision
- ChannelVariant
- AssetRecord
- ReviewReport
- DetectionJob
- Approval
- DeliveryIntent
- DeliveryReceipt
- Run / Step / Event

All content revisions are immutable. Head updates use expected-revision/CAS semantics.

## 9. Detection

Zhuque remains a real external detector, not a self-evaluation prompt.

The exact submitted text bytes, normalized text hash, provider configuration, timestamp, raw response, normalized interpretation, policy verdict, and human decision SHALL remain separately recorded.

A content change invalidates stale detection and approval as defined by policy.

## 10. Delivery

Delivery flow remains:

```text
prepare bundle
-> show account/version/action
-> trusted user approval
-> persist intent
-> execute channel adapter
-> record remote identifier
-> read back
-> compare
-> verified / conflict / unknown / failed
```

A channel skill returning success does not by itself set `verified`.

## 11. Migration from the Earlier 12-skill Plan

Earlier local skill responsibilities map as follows:

| Earlier responsibility | V1 refined owner |
|---|---|
| content-brief | content-harness + schema/kernel |
| content-research | vendor research/source skills + claim registry |
| content-outline | vendor writing method selected by harness |
| content-write | vendor writing/copywriting skills |
| content-fact-check | runtime protected-fact checks + review method |
| content-humanize | vendor humanizer/copy-editing skills + kernel validation |
| content-visual-plan | content-harness creates VisualBrief |
| content-format | Baoyu formatting/rendering skills |
| content-detect | harness invokes kernel detection service |
| content-deliver | harness invokes kernel delivery service + channel adapter |
| content-repurpose | harness invokes selected vendor writing method |
| content-harness | remains plugin-local |

This is a responsibility migration, not a product-scope reduction.

## 12. Rollout

CF-001 first establishes the immutable vendor mechanism and source review.

No vendor skill is treated as release-ready until:
- source and license are verified;
- exact immutable ref is selected;
- runtime dependencies are documented;
- compatibility tests exist;
- digest verification is implemented.

The project then follows W0 through W6 while preserving CF task IDs.
