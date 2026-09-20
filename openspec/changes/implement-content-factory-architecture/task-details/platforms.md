# platforms 详细任务卡

全部 NOT_STARTED。子项状态在 [tasks.md](../tasks.md)；不重复创建父任务。先读完整架构和原变更，以下测试命令均为实施入口，不是已执行结果。

<a id="cf-043"></a>
## CF-043 — Candidate provenance and intake snapshots

**依赖：** CF-001。

**文件：** `packages/core/src/skills/candidates.ts`、`schemas/skill-candidate.schema.json`、`docs/verification/channel-intake/`。

**输入：** SkillHub query/detail evidence and historical leads。

**输出：** canonical identity/status records; preserve null version/license; distinguish index snapshots from live pages。

**验收：** R14, R15, R16, R17。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 只有 SkillHub 展示名或高分无 owner/version/license；保持 discovered，禁止假锁。

**验证命令：** `npm run test -- tests/channels/candidate-intake.test.ts`。

**证据：** `docs/verification/tasks/CF-043.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-044"></a>
## CF-044 — Separate host/source/channel context and resolve ambiguity

**依赖：** CF-002。

**文件：** `packages/core/src/channels/context.ts`、`schemas/channel-intent.schema.json`。

**输入：** Request, selected variant/account and host probe。

**输出：** HostContext/SourceContext/ChannelIntent; source URL and host cannot choose target。

**验收：** R01, R02, R03, R04, R05, R06, R07, R08, R09。

**约束：** 不提升未验证技能与渠道权限。

**反例：** Codex + YouTube 来源 + 小红书目标；三者独立；“发微信”不能默认选公众号。

**验证命令：** `npm run test -- tests/channels/context.test.ts`。

**证据：** `docs/verification/tasks/CF-044.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-045"></a>
## CF-045 — Versioned profiles and per-format recipe registry

**依赖：** CF-044。

**文件：** `profiles/channels/`、`recipes/`、`packages/core/src/channels/registry.ts`。

**输入：** 16-channel catalog。

**输出：** versioned profiles and explicit format recipes; growth/podcast/baidu do not become publishers。

**验收：** R07, R10, R11, R12。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 39 个已声明渠道×形式缺一个 Recipe 或 growth 当 publisher；注册校验失败。

**验证命令：** `npm run test -- tests/channels/profiles.test.ts`。

**证据：** `docs/verification/tasks/CF-045.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-046"></a>
## CF-046 — Single-harness platform-aware routing

**依赖：** CF-013、CF-044、CF-045。

**文件：** `skills/content-harness/SKILL.md`、`skills/content-harness/references/`、`packages/core/src/channels/select-recipe.ts`。

**输入：** Resolved context。

**输出：** stage graph and RoutingDecision with selected/rejected bindings; preserve existing run modes and add task_kind。

**验收：** R02, R08, R10, R11, R12。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 用户显式目标与选中账号冲突；保存 needs_clarification，不选默认渠道。

**验证命令：** `npm run test -- tests/channels/harness-routing.test.ts`。

**证据：** `docs/verification/tasks/CF-046.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-047"></a>
## CF-047 — Shared vendor integration and semantic adaptation

**依赖：** CF-005、CF-015、CF-018、CF-043。

**文件：** `skills.lock.json`、`vendor/`、`adapters/content-methods/`、`tests/fixtures/vendor-content/`。

**输入：** Approved exact source packages。

**输出：** complete installed methods; resolve social/product-marketing aliases; scripts/references/dependencies retained; patches separately hashed。

**验收：** R13, R17, R18, R19, R20, R21。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 只复制 SKILL.md 缺 scripts/references，或 locked 内容被改；安装/合约验证失败。

**验证命令：** `npm run test -- tests/channels/vendor-methods.test.ts`。

**证据：** `docs/verification/tasks/CF-047.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-048"></a>
## CF-048 — Channel-specialized candidate conformance

**依赖：** CF-043、CF-044、CF-047。

**文件：** `adapters/channel-sources/`、`docs/verification/channel-candidates/`。

**输入：** Historical/current leads。

**输出：** reviewed primary/alternate bindings per capability; distinguish MCP server from wrapper, acquisition from publishing, account article from video。

**验收：** R13, R18, R22, R23。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 小红书 MCP server 被当作 Skill，知乎想法发布器用于回答；绑定检查拒绝。

**验证命令：** `npm run test -- tests/channels/channel-candidates.test.ts`。

**证据：** `docs/verification/tasks/CF-048.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-049"></a>
## CF-049 — Runtime eligibility, progressive loading and fallback

**依赖：** CF-046、CF-047、CF-048。

**文件：** `packages/core/src/skills/select-binding.ts`、`packages/core/src/skills/eligibility.ts`。

**输入：** Installed integrity + context/permissions/budget。

**输出：** one primary with reasons; no automatic install or privilege expansion。

**验收：** R18, R19, R20, R21, R23。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 主技能失效而备选增加费用/数据收件方/权限；要求新授权，不隐式回退。

**验证命令：** `npm run test -- tests/channels/skill-routing.test.ts`。

**证据：** `docs/verification/tasks/CF-049.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-050"></a>
## CF-050 — Channel-native source-grounded writing and editing

**依赖：** CF-016、CF-019、CF-045、CF-049。

**文件：** `recipes/`、`tests/fixtures/channel-writing/`、`docs/verification/channel-editorial/`。

**输入：** Shared claims。

**输出：** native article/note/thread/answer/script output; preserve facts and terminology, not source anecdotes or private author facts。

**验收：** R10, R24, R25, R26。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 同源资料写公众号/小红书/抖音；结构独立、事实一致，不三级压缩同一稿。

**验证命令：** `npm run test -- tests/channels/native-writing.test.ts`。

**证据：** `docs/verification/tasks/CF-050.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-051"></a>
## CF-051 — Channel-format media briefs and external receipts

**依赖：** CF-021、CF-050。

**文件：** `adapters/image-factory/`、`schemas/media-brief.schema.json`、`packages/core/src/channels/assets.ts`。

**输入：** Card/cover/script needs。

**输出：** explicit external VisualBrief/media brief and receipts; no generated visual skills in vendor lock。

**验收：** R27, R28, R29。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 旧 variant 的媒体回执迟到或脚本被标为 MP4；拒绝绑定/交付。

**验证命令：** `npm run test -- tests/channels/media-boundary.test.ts`。

**证据：** `docs/verification/tasks/CF-051.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-052"></a>
## CF-052 — Sibling variants and dependent evidence invalidation

**依赖：** CF-011、CF-028、CF-032、CF-050、CF-051。

**文件：** `packages/core/src/content/channel-variants.ts`、`packages/core/src/review/channel-validity.ts`。

**输入：** SourceBundle + target list。

**输出：** independent revisions/hashes/reports; changing channel/locale/text invalidates affected approvals。

**验收：** R30, R31, R32, R33, R34。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 修改一个兄弟稿；只使相关证据失效，其他有效稿结果不被擦除。

**验证命令：** `npm run test -- tests/channels/variant-isolation.test.ts`。

**证据：** `docs/verification/tasks/CF-052.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-053"></a>
## CF-053 — Per-action channel delivery capabilities

**依赖：** CF-034、CF-035、CF-036、CF-052。

**文件：** `packages/core/src/delivery/capabilities.ts`、`adapters/wechat/`、`docs/verification/channel-support/`。

**输入：** Target account/format/action + approval。

**输出：** allowed draft or blocked/export path; readback and unknown-write reconciliation retained。

**验收：** R03, R04, R22, R23, R32, R34, R35。

**约束：** 不提升未验证技能与渠道权限。

**反例：** read 权限被用于 publish 或视频号调用公众号适配器；调用前拒绝。

**验证命令：** `npm run test -- tests/channels/delivery-capabilities.test.ts`。

**证据：** `docs/verification/tasks/CF-053.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-054"></a>
## CF-054 — Metrics and comment-draft feedback

**依赖：** CF-044、CF-049、CF-052。

**文件：** `packages/core/src/channels/feedback.ts`、`schemas/channel-metric.schema.json`、`schemas/comment-draft.schema.json`。

**输入：** Authorized observations。

**输出：** attributed metric report/reply drafts and proposed recipe revision; never sends or auto-updates recipes。

**验收：** R36, R37, R38, R39。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 缺分母的数据与含指令评论；unknown 不是 0，仅产草稿/建议，无外部写入。

**验证命令：** `npm run test -- tests/channels/feedback.test.ts`。

**证据：** `docs/verification/tasks/CF-054.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-055"></a>
## CF-055 — Sourced platform constraints and detector applicability

**依赖：** CF-027、CF-045、CF-049。

**文件：** `packages/core/src/channels/constraints.ts`、`packages/core/src/detection/applicability.ts`。

**输入：** Dated scoped constraints + exact final text。

**输出：** evaluable policy or explicit unknown/blocked; no folklore multipliers or universal score。

**验收：** R11, R25, R31, R40。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 规则过期或检测语言不支持；阻断相关动作/not_evaluable，不发明通用 AI 阈值。

**验证命令：** `npm run test -- tests/channels/constraints.test.ts`。

**证据：** `docs/verification/tasks/CF-055.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-056"></a>
## CF-056 — Routing corpus, adversarial inputs and native quality

**依赖：** CF-038、CF-039、CF-050、CF-051、CF-052、CF-053、CF-054、CF-055。

**文件：** `tests/channels/`、`tests/fixtures/channel-writing/`、`docs/verification/channel-regression/`。

**输入：** R01–R42 与全部渠道形式样本。

**输出：** Run all R01–R42 and every declared channel/format example; retain original 30-document benchmark, privacy and factual gates。

**验收：** R01–R42。

**约束：** 不提升未验证技能与渠道权限。

**反例：** R01–R42 任一失败或一种形式未覆盖；不声明渠道内容生产全部可用。

**验证命令：** `npm run test -- tests/channels/channel-acceptance.test.ts`。

**证据：** `docs/verification/tasks/CF-056.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-057"></a>
## CF-057 — Actual host/channel/account verification

**依赖：** CF-041、CF-056。

**文件：** `docs/verification/channel-host-matrix.md`、`docs/verification/channel-live-index.json`。

**输入：** Exact release candidate on actual hosts。

**输出：** separate read/author/export/draft evidence; unsupported combinations stay NOT_RUN。

**验收：** R22, R34, R35, R41。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 只有旧版本或其他账号的验证；对应宿主×渠道×账号状态仍 NOT_RUN。

**验证命令：** `npm run test -- tests/channels/host-channel-contract.test.ts`。

**证据：** `docs/verification/tasks/CF-057.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-058"></a>
## CF-058 — Integrated V1 release evidence gate

**依赖：** CF-001、CF-037、CF-040、CF-057。

**文件：** `scripts/release-gate.mjs`、`docs/verification/channel-release.md`。

**输入：** Base P0 + new channel evidence。

**输出：** release verdict bound to same commit/package; CF-042 requires this gate, never the reverse。

**验收：** R14, R17, R28, R41, R42。

**约束：** 不提升未验证技能与渠道权限。

**反例：** 缺任一基础/渠道证据；聚合门禁失败；不得依赖 CF-042 从而产生环。

**验证命令：** `npm run test -- tests/channels/channel-release.test.ts`。

**证据：** `docs/verification/tasks/CF-058.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

