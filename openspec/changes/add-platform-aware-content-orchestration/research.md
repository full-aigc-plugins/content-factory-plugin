# Research and evidence register

Checked: 2026-09-22. This register distinguishes observations from integration decisions. Catalog descriptions are not executed capability evidence. Source documents can change; release intake must pin the actual reviewed package.

## 1. Initial repository baseline (historical)

At the initial inspection, target commit `2fe35bcd499f7befcdb82804ea1504c2931671ab` (tree `99faadb20bc3f812610f1033a25f9b34393a9a76`) contained the pending V1 OpenSpec and an initial README but no runtime. This paragraph is a historical input to the platform-aware proposal; current implementation status comes from `docs/verification/tasks/CF-001.json` through `CF-058.json`, not from that old tree.

## 2. Historical Content Ops

Source root: [Content Ops](https://github.com/partme-ai/teams-of-agents/tree/567ff26a923fb41b15a3cadf7095cbc06d5e5770/3%E3%80%81Content%20Ops). Observed tree `02a6237fd285ddc7a8a7e28baee4f403ec32377a` contains 19 directories. The top README lists only 11 domestic channels; the directory inventory is broader.

Read the top README, WeChat and Xiaohongshu evaluation sections, and relevant README sections for Douyin, Bilibili, Zhihu, WeChat Channels, Juejin, Toutiao and Baijiahao. Other channel folders establish historical coverage only, not completed source review. An audit-file path for LinkedIn returned 404; it is not evidence that the channel is unavailable. No claim is made that every agent file was inspected.

| Source | Reused insight | Not carried forward |
|---|---|---|
| wechat-article/SKILLS-EVALUATION.md | source search/extraction; separate formatting and draft execution; deduplicate publishers | historical download rankings; personal-chat reply capability treated as account comments |
| xiaohongshu/SKILLS-EVALUATION.md | separate search, topic research, native writing, publisher, feedback | installing overlapping MCP wrappers; old 3.x scores treated as current quality |
| douyin/README.md; bilibili/README.md | hook/script/chapters/subtitles differ from article production | assuming downloader/publisher slugs are installed and live-tested |
| zhihu/README.md; juejin/README.md | distinguish questions/answers and technical explanations | assuming social-push supports every content form |
| wechat-video/README.md | video channel is separate from account articles | routing baoyu-post-to-wechat to WeChat Channels |
| toutiao/README.md; baijiahao/README.md | long-form channels with source and account constraints | filling historical connector gaps with invented API support |
| top README | opencli-skill -> content extraction -> structured report, as an optional read path | global installation commands, unattended schedules, automatic writes |

The 16-channel editorial profiles in this change are design choices, not claims about proprietary ranking formulas or current platform rules. growth is a task domain; podcast is a medium; baidu is an ecosystem requiring refinement.

## 3. SkillHub access and freshness limitation

The requested [content-creation catalog](https://skillhub.cn/skills?category=content-creation&sortBy=score) was retrieved live on 2026-09-22. The rendered first page showed 24 score-sorted entries; exact identity/version and selected metadata were cross-checked through the public read-only search endpoint documented by the current `find-skills` entry. The resulting shortlist is recorded in `docs/verification/channel-intake/2026-09-22-skillhub-content-creation.json`.

This is still partial discovery: later pagination, licenses, immutable repositories, package bytes, dependency trees, signatures and runtime contracts were not retrieved. Search endpoint scores are query-relevance signals, not category scores. No candidate was installed, executed or promoted from `discovered`; a high rank, download count or verified-publisher badge is not capability evidence.

## 4. Current primary sources and intake decisions

| Ref | Source | Observation | Decision |
|---|---|---|---|
| S1 | [Tencent/skillhub README](https://github.com/Tencent/skillhub/blob/main/README.md) | official Open API, official skills, and host plugin are distinct deliverables | use official discovery interface as a candidate; do not add a different host's plugin dependency |
| S2 | [find-skill-skillhub](https://github.com/Tencent/skillhub/blob/main/skills/find-skill-skillhub/SKILL.md) | keyword/category searches via GET /api/skills; multiple queries then intent matching | review discovery method; isolate installation from content runs |
| S3 | [skillhub-trace-evaluator](https://github.com/Tencent/skillhub/blob/main/skills/skillhub-trace-evaluator/SKILL.md) | package-based quality review; trust.scan explicitly skipped | useful evaluation method, not security clearance |
| S4 | [signature instructions](https://skillhub.cn/docs/verify-signature?slug=docx-editing&version=0.3.0) | version signature, raw payload, content_hash and platform keys | retain provenance; independently verify bytes and behavior |
| S5 | [效享网络 publisher](https://skillhub.cn/enterprise/org-cgmj9q07) | Solo Mcn Domain; Douyin Data Method; Video Transcript Method; Marketing Strategy Domain | method/connector candidates; exact identities, dependencies, licenses and packages still need retrieval |
| S6 | [劳希 publisher](https://skillhub.cn/enterprise/org-achi7v92) | 写作文风复刻大师; 网络搜索工具·上网助手; 找技能·风险评估版 | optional candidates, not replacements for kernel policy |
| S7 | [短视频选题技巧](https://skillhub.cn/skills/user_42f6d881/jinqiangdashu) | inspected indexed v1.0.1 description includes deliberate factual-error engagement tactics | original candidate rejected for integrity conflict; 4.3 catalog score is not acceptance |
| S8 | [find-skills catalog entry](https://skillhub.cn/skills/find-skills) | inspected text discusses disabling/shadowing the original discovery skill | do not adopt that behavior; this entry is not Tencent's find-skill-skillhub |
| S9 | [marketingskills/social](https://github.com/coreyhaines31/marketingskills/blob/main/skills/social/SKILL.md) | social strategies, repurposing and short-video scripting; metadata version 2.2.0 | content-method candidate; schedules and platform-limit claims require separate verification |
| S10 | [marketingskills versions](https://github.com/coreyhaines31/marketingskills/blob/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/VERSIONS.md) | social-content -> social; product-marketing-context -> product-marketing | resolve names from selected source version, not memory |
| S11 | [xiaohongshu-mcp upstream](https://github.com/xpzouying/xiaohongshu-mcp/blob/main/README.md) | MCP server project; links separate skill wrappers and browser product | server, wrapper and registry slug require explicit identity mapping |
| S12 | [Baoyu skill source](https://github.com/full-aigc-skills/baoyu-skills/tree/main/skills) | nine content-oriented candidates retained from the previous review | no new release pin or runtime validation claimed |

Observed Git blob hashes: S2 `5857dbc76cb7bec4098542461308e1f02517f25c`; S3 `b3c2afda694a4dcf766ac6366e6e6309abf12c0f`; S9 `ab1d083ef4a9dd2a91c1eaedfb5cb745c3055d24`; S11 README `55eb148c35d454c328c504492ba63eb869410aff`. These are file observations, not release-commit pins or complete-package digests.

## 5. Release intake still required

Retrieve exact owner/slug, files, license, version and dependencies; inspect side effects and transitive calls; run isolated contracts; publish an approved immutable snapshot if needed; synchronize only the allowlist; verify installed effective bytes; test actual host/channel/account paths. Do not replace this sequence with market score sorting.

OpenSpec 1.8.0 is installed and all three related changes pass strict validation. Selected Vendor sources have immutable offline admission and integrity evidence; remaining catalog candidates are not admitted by ranking alone. Private-account access, live AI content detection, real host/channel sessions and live publication remain `NOT_RUN`.
