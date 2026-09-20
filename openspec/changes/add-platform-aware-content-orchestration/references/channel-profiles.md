# Channel profile and recipe catalog

These are proposed V1 authoring strategies, not platform algorithm claims or verified publishing capabilities. All profile revisions start as design revision 1. Each runtime profile must implement the common contracts in [design](../design.md). Source evidence and current discovery limits are in [research](../research.md).

## 1. First-class channels

| channel_id | Format resolution | Research and authoring recipe | Deliverable and QA emphasis |
|---|---|---|---|
| wechat-article | article or image_text | reader problem -> sourced outline -> explanatory narrative -> author edit -> channel HTML | article, digest, citations, image bindings; final visible text matches detection; primary draft/readback target |
| xiaohongshu | note, carousel_copy or video_script | audience/search intent -> relevant examples -> practical title -> authentic case or checklist -> card-by-card copy | note/caption/tags/card brief; no invented first-person experience; Image Factory makes cards; export until adapter verified |
| douyin | short_video_script or image_text_copy | topic and audience -> truthful opening hook -> spoken beats -> demonstration/payoff -> closing action | narration/shot beats/subtitle draft/caption; read-aloud and timing estimates labeled; not a finished video |
| bilibili | video_script, article or dynamic | audience question -> chapter outline -> demonstration/evidence -> explanation -> recap | chapters/narration/subtitle draft/description; technical accuracy, chapter continuity and code provenance |
| weibo | post, thread or headline_article | event/source context -> concise point -> evidence -> optional linked context | short post/thread/long-form package; distinguish observed event time from publication time; no public-write assumption |
| zhihu | answer, article or thought | resolve actual question -> answer first -> reasoning -> source support -> limitations/counterexamples | answer tied to question_id or standalone article; no irrelevant marketing boilerplate; thought publisher is not answer publisher |
| toutiao | article, micro_post or video_script | audience interest -> supported context -> clear explanation -> source-aware conclusion | format-specific text and asset requests; avoid exaggerated news framing and fabricated causal claims |
| kuaishou | video_script or image_text_copy | concrete use scene -> demonstration or documented story -> plain-spoken explanation | script/caption/story beats; do not fabricate a creator's livelihood, customer, or personal history |
| juejin | technical_article | technical problem -> environment -> reproducible steps -> code/results -> trade-offs | Markdown/code/version requirements; command preservation, citation and execution authorization |
| wechat-video | video_script or caption | viewer question -> credible explanation/demonstration -> spoken structure -> sharing context | narration/caption/cover brief; never route to Official Account draft adapter |
| baijiahao | article or video_script | user/search question -> sourced explanation -> structured sections -> evidence boundaries | article/script/source package; not a generic baidu target; no assumed publisher availability |
| x | post, thread or article | concise idea -> evidence -> thread argument or article structure -> contextual close | locale-specific post/thread/article package; resolve twitter alias; limits verified by format/account before delivery |
| linkedin | post, article or document_copy | professional problem -> documented lesson/case -> actionable detail -> discussion prompt | post/article/slide copy; professional voice and supported results; not automatic lead solicitation |
| instagram | caption, carousel_copy or reel_script | visual story intent -> slide/beat progression -> caption/context -> accessible descriptions | caption/card copy/reel script/alt-text draft; Image Factory handles rendered assets |
| tiktok | short_video_script or caption | locale-specific audience -> truthful hook -> spoken/demo beats -> payoff | script/caption/subtitles; separate profile/account/policies from Douyin, not a translated account alias |
| reddit | post or comment_draft | identify community/question -> inspect supplied/current community rules -> substantive contribution -> disclosure | community-specific post/comment draft; prohibit hidden promotion, vote manipulation, mass comments or invented testimonials |

## 2. Legacy directories that are not destinations

| Legacy directory | Interpretation | Required handling |
|---|---|---|
| growth | cross-channel objective/domain | select an actual channel and measurable objective; no growth publisher |
| podcast | medium/content family | script/show notes allowed; require actual feed/provider for remote delivery; external audio production |
| baidu | search ecosystem and specialties | resolve search/SEO/Tieba/Baijiahao purpose; do not silently equate them |

Generic Markdown/HTML working export is an explicitly chosen fallback, not a seventeenth verified publishing platform. YouTube may be a transcript source in V1; do not infer a YouTube publishing profile merely because an input URL is YouTube.

## 3. Required per-profile fields

Identity/aliases; formats/locales; intended audience and goals; topic/research approach; structure/hook policy; style/terminology constraints; citations/disclosure; title/summary/tag treatment; image/video/audio brief requirements; output schema; mandatory fact/style/format QA; detection policy and scope; delivery actions and account constraints; metrics definitions; versioned source evidence; compatible recipes; supported/unsupported behaviors.

All formats listed above must resolve to explicit recipes, even where several reuse one method. If a format has not passed content evaluation, label it planned and do not silently route to another format. Public platform limits stay externally sourced, dated and scope-specific; this document does not assert current length/image/rate limits.

## 4. Capability bundles, not universal prompts

- Evidence long-form: source.read -> research.grounded -> writing.explanatory -> editing.voice -> formatting.markdown/html -> final-text QA.
- Practical note/card: source.read -> research.audience -> writing.native_note -> card_copy -> editing.voice -> visual.brief -> variant QA.
- Short-video: source.read -> topic.frame -> writing.spoken -> beat_plan -> subtitle_copy -> media.brief -> spoken QA.
- Technical: source.read -> research.technical -> writing.tutorial -> protected_code_review -> markdown -> reproducibility review.
- Question/community: source.read -> question/rules.resolve -> answer/discussion.write -> attribution/disclosure review -> community QA.
- Professional social: source.read -> product_context -> writing.social_case -> editing.voice -> format-specific export.

Bindings come from the admitted catalog, not these generic capability names. One capability may use a shared vendor, but the recipe inputs, constraints and review differ. The harness remains the only plugin-local skill.

## 5. Example fan-out

Input: real product notes and a YouTube demo; targets: WeChat article, Xiaohongshu carousel, Douyin script.

The source/claim package is shared. WeChat receives an explanatory article recipe; Xiaohongshu receives practical card copy and an Image Factory brief; Douyin receives spoken beats and a media-production brief. Each has a separate revision/hash/review/detection scope. Only the explicitly approved WeChat draft may enter the baseline remote-delivery flow. Other branches export their own working packages until their adapters and policies are independently verified.
