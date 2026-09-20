# Skill integration catalog

This is a selection/admission plan, not an installed lockfile. No candidate in this document is declared live_verified. R = source text inspected; H = historical user selection only; D = current directory/detail discovery; B = prior baseline candidate. A rating or download count is never execution evidence. See [research](../research.md) for exact observation scope.

## 1. Shared content methods and governance

| Candidate identity | Capability | Evidence | Intended disposition / required adaptation |
|---|---|---|---|
| full-aigc-skills/baoyu-skills :: baoyu-url-to-markdown | source.read | B | core; untrusted text, source/locator capture, host/browser probe; include scripts/dependencies |
| full-aigc-skills/baoyu-skills :: baoyu-youtube-transcript | source.caption | B | optional; preserve timestamps/language; missing captions do not authorize new ASR or media download |
| full-aigc-skills/baoyu-skills :: baoyu-wechat-summary | source.chat_digest | B | optional sensitive path; explicit chat/time scope, local dependency, privacy; no blanket sandbox disable |
| full-aigc-skills/baoyu-skills :: baoyu-translate | language.translate | B | core reusable method; glossary, semantic/fact check, separate translated revision |
| full-aigc-skills/baoyu-skills :: baoyu-format-markdown | formatting.markdown | B | core; no substantive title/summary invention after approval |
| full-aigc-skills/baoyu-skills :: baoyu-markdown-to-html | formatting.html | B | core; freeze link/citation transformations before final detector text |
| full-aigc-skills/baoyu-skills :: baoyu-post-to-wechat | delivery.wechat_draft | B | primary execution adapter; kernel owns approve/intent/readback |
| full-aigc-skills/baoyu-skills :: baoyu-post-to-weibo | delivery.weibo_prepare | B | optional; no automatic public posting in V1 |
| full-aigc-skills/baoyu-skills :: baoyu-post-to-x | delivery.x_prepare | B | optional; respect selected browser mode; no inferred public-publish permission |
| ComposioHQ/awesome-claude-skills :: content-research-writer | research.grounded / writing.longform | B | source-first writing candidate; citations require actually read evidence |
| coreyhaines31/marketingskills :: content-strategy | topic.strategy | D | core strategy candidate; not a data collector or guaranteed traffic method |
| coreyhaines31/marketingskills :: product-marketing | context.product | D | product/brand tasks only; use real product facts |
| coreyhaines31/marketingskills :: copywriting | writing.marketing | D | marketing recipe, not default technical/tutorial prose |
| coreyhaines31/marketingskills :: copy-editing | editing.copy | D | editorial candidate; protect facts/commands and bounded iterations |
| coreyhaines31/marketingskills :: social | writing.social / writing.spoken | R | reviewed replacement name for social-content; adapt by channel; verify limits and discard unrequested schedules |
| op7418/Humanizer-zh | editing.voice.zh | B | language-specific candidate; resolve installed name from actual package; do not stack humanizers automatically |
| blader/humanizer | editing.voice | B | author-sample/fact-preservation candidate; do not fabricate biography |
| Tencent/skillhub :: find-skill-skillhub | governance.discovery | R | preferred official discovery candidate; approved development intake only, no installs during writing |
| Tencent/skillhub :: skillhub-trace-evaluator | governance.quality_review | R | evaluation support; trust.scan skipped, independent security review remains mandatory |

## 2. Channel-specialized historical candidates

These names are preserved as intake leads, not assumed current registry identities. Resolve owner/slug/version/license and read the actual package before selecting one.

| Channel | Candidate leads | Decision |
|---|---|---|
| wechat-article | wechat-article-search; wechat-article-extractor; wechat-mp-cn | H; search/extraction/metrics are separate capabilities; only add specialized extraction if the shared reader fails a known fixture |
| xiaohongshu | xiaohongshu-content; xiaohongshu-founder-growth-writer; xiaohongshu-deep-research | H; native-note strategy/research intake; compare with social + channel profile before adding duplicates |
| xiaohongshu | xiaohongshu-mcp; xiaohongshu-mcp-skill; xiaohongshu-mcp-skills | H; choose one verified wrapper/backend pairing; aliases do not prove same publisher or implementation |
| xiaohongshu | xpzouying/xiaohongshu-mcp | R README only; server project, not a drop-in Skill; confirm wrapper, endpoint, consent and compatibility independently |
| douyin | douyin-hot-trend; douyin-downloader; douyin-video-fetch; douyin-publish | H; historical names, permissions and download rights unresolved; no silent downloader/publisher fallback |
| bilibili | bilibili-hot-monitor; bilibili-update-viewer; bilibili-helper; bilibili-subtitle-download-skill; bilibili-analytics | H; separate discovery/caption/metadata/analytics; maintainers and versions unresolved |
| bilibili | bilibili-video-publish; bilibili-upload | H; choose one only after account/format/readback evidence; video existence must be checked |
| juejin | juejin-article-trends | H; optional read capability; technical writing remains source-grounded |
| zhihu / juejin | social-push | H; per-format contract probe required; thoughts, answers and articles cannot share an assumed publish contract |
| wechat-video | wechat-video-publish | H; separate from Official Accounts; not a Baoyu account-publishing alias |
| shared read path | opencli-skill | H; logged-in browser read supplement; underlying command availability and permissions must be discovered |
| toutiao / baijiahao / kuaishou / other profiles | no additional verified publisher selected | channel content recipes and working export first; unsupported live actions remain blocked |

## 3. Current SkillHub discoveries

Only titles are known for the enterprise listings; owner/slug, version, full package and license are unresolved. Do not manufacture install commands or release pins from these display names.

| Publisher / title | Intended capability | Decision |
|---|---|---|
| 效享网络 / Solo Mcn Domain | topic/platform/feedback strategy references | D; priority method review; extract content-domain references only, do not add a second harness or visual engine |
| 效享网络 / Douyin Data Method | authorized platform data queries | D; optional data adapter review; account/API cost and field semantics must be verified; not a writing skill |
| 效享网络 / Video Transcript Method | transcript-acquisition method | D; preserve caption path; ASR/new model calls remain separately scoped, not a hidden V1 dependency |
| 效享网络 / Marketing Strategy Domain | brand/marketing research method | D; optional context, not a replacement for factual research |
| 劳希 / 写作文风复刻大师 | sample-based voice analysis | D; compare against existing humanizer route; one primary per context, privacy and fact-preservation review |
| 劳希 / 网络搜索工具·上网助手 | host-aware acquisition method | D; review routing references; kernel retains permission and retry authority |
| 劳希 / 找技能·风险评估版 | intake review method | D; optional secondary comparison to official discovery; a badge cannot approve installation |

## 4. Exclusion and conflict register

- Images/visual production: baoyu-image-gen, baoyu-cover-image, baoyu-article-illustrator, baoyu-xhs-images, baoyu-infographic, baoyu-comic, baoyu-compress-image, baoyu-diagram, baoyu-slide-deck remain outside this plugin's vendor set. Use Image Factory; asset import/upload still belongs to delivery.
- baoyu-danger-gemini-web: unnecessary mixed generation backend. baoyu-danger-x-to-markdown: not an automatic fallback; default reader failure does not grant reverse-engineered API consent.
- baoyu-electron-extract: software extraction, not content operations.
- SkillHub @user_42f6d881/jinqiangdashu observed v1.0.1: reject original package behavior promoting deliberate factual mistakes for engagement. Do not reproduce its unsupported performance multipliers.
- The inspected skillhub.cn/skills/find-skills entry: reject shadowing/disabling other skills. Do not confuse it with Tencent/skillhub's find-skill-skillhub.
- Fanqie-novel-only skills: do not trigger for generic article writing or other channels. Fictional-story production is outside this first content-operations integration.

## 5. Admission and runtime selection algorithm

Discover -> resolve canonical identity -> read package and license -> inspect references/scripts/dependencies/outbound calls -> review integrity and privilege -> approve immutable source snapshot -> lock -> install through controlled setup -> run contracts -> record host/channel live evidence.

At runtime: filter admitted and installed candidates by byte integrity, host/runtime, output schema, channel/format/locale, allowed action and budget; then choose the most appropriate method. Keep one primary per overlapping capability. Save rejection/fallback reasons. A fallback changing data recipients, account, costs or privileges requires new consent.

No stable publisher has been newly installed by this change. Display recipe coverage, candidate readiness, installed compatibility, and live delivery support separately.
