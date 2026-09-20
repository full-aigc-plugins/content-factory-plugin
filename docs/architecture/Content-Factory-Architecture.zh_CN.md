# Content Factory 架构设计

> 文档版本：1.0（架构文档版本，不是插件发布版本）
> 更新日期：2026-09-20
> 状态：已确认方向的设计与实施任务基线；运行时尚待实现与验收。
> 对照仓库基线：`c8ce6e5a87dab0532279c16c153b0b2d62a0f8a9`。

## 文档用途与来源

本文件完整收录用户确认的“总体结构”“平台策略”“外部技能、Harness 与媒体工厂连接”三部分正文、三张主图和平台 Recipe 示例图，并补充工程接口、模块职责、状态、故障恢复和实施映射。三部分不是缩略图，也不以链接替代正文。

完整呈现正文在下面的 PRESENTATION 区块中，保真摘要见 [preservation.json](preservation.json)。捕获时只移除了无法在 GitHub 使用的会话引用标记；正文及 text 图原样保留。来源哈希用于本次捕获之后的完整性检查，不证明不可取得的原始会话传输字节。

现有两个变更继续有效：[V1 基线](../../openspec/changes/establish-content-factory-v1/design.md)、[平台感知设计](../../openspec/changes/add-platform-aware-content-orchestration/design.md)。本次[执行拆分](../../openspec/changes/implement-content-factory-architecture/tasks.md)使用原 CF-001–CF-058 父任务，不改编号，不用文档交付冒充产品验收。

当前仓库是设计仓：模块目录、接口与测试命令在本文中均是待实施契约。唯一已完成的范围是本次架构与任务文档整理。图片、视频、检测、公众号和三宿主实际能力按各自证据验收。

<!-- PRESENTATION-BEGIN -->
现在的规划可以分成 **总编排、渠道策略、技能与媒体协作** 三层来看。关键顺序是：**先识别目标平台和内容形式，再决定研究、写作、排版和交付策略，而不是写完一篇通用文章后再适配平台。**这也是当前 OpenSpec 的编排方式。

## 一、Content Factory 总体结构

```text
                              用户需求 + 真实素材
                                      │
                                      ▼
                               content-harness
                               唯一自有编排 Skill
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
            HostContext          SourceContext        ChannelIntent
              宿主识别              来源识别              目标识别
                 │                    │                    │
          Codex / ZCode / Kimi   URL / 文档 / 字幕     平台 / 内容形式
          OS / Browser / MCP     群聊 / 产品资料      语言 / 读者 / 目标
          文件 / 工具 / 权限     来源 / 定位 / 证据   账号 / 请求动作
                 │                    │                    │
                 └────────────────────┼────────────────────┘
                                      │
                                      ▼
                               ChannelProfile
                               选择渠道策略档案
                                      │
                   选题角度 / 内容结构 / 表达方式 / 引用规范
                   标题摘要 / 标签 / 媒体需求 / 渠道约束
                                      │
                                      ▼
                                ContentRecipe
                               选择本次生产流程
                                      │
                   平台 × 内容形式 × 任务类型 × 目标 × 语言
                                      │
                                      ▼
                                Skill Routing
                               选择可执行技能组合
                                      │
                   准入 / 完整性 / 宿主兼容 / 权限 / 预算
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
          INGEST                    CREATE                    DELIVER
        素材与研究输入             内容生产与编辑             排版与交付准备
            │                         │                         │
     URL → Markdown           Research Writer              Format MD
     YouTube Transcript       Content Strategy             Markdown → HTML
     WeChat Digest            Product Context              Channel Preview
     Local Documents          Copywriting                  Export Package
     Channel Search           Social Content               WeChat Adapter
     Topic / Trend Data       Copy Editing                 Weibo Adapter
     Authorized Metrics       Humanizer                    X Adapter
     Authorized Comments      Translate                    Other Adapters
            │                 Channel Repurpose                  │
            │                 Visual / Media Brief               │
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                                Runtime Kernel
                          贯穿所有阶段的状态与规则内核
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
          Source / Evidence     Revision / Variant      Claim / Fact Guard
          来源登记与定位         不可变版本与渠道稿       事实与引用关系
          素材授权与出处         Diff / CAS / Conflict    数字 / 日期 / 单位
          原始材料与快照         Profile / Recipe 版本    代码 / 命令 / URL
                │                     │                     │
                └─────────────────────┼─────────────────────┘
                                      │
                    Run / Step / Checkpoint / Recovery
                    Consent / Budget / Audit / Asset Receipt
                                      │
                                      ▼
                          独立渠道稿 + 最终预览
                                      │
                       ┌──────────────┴──────────────┐
                       │                             │
                       ▼                             ▼
                 Working Export               Quality Gates
                   工作稿导出                  按渠道执行质量检查
               明确尚未验证的项目                     │
                                                     ▼
                                             Zhuque / Review
                                         真实检测 + 编辑审阅
                                         检测范围绑定最终文字
                                                     │
                                                     ▼
                                                  Approval
                                         版本 × 渠道 × 账号 × 动作
                                                     │
                                  ┌──────────────────┴──────────────────┐
                                  │                                     │
                                  ▼                                     ▼
                           Verified Export                      Authorized Delivery
                            已验证内容包                         授权后的渠道执行
                                                                        │
                                                                        ▼
                                                                 Readback / Verify
                                                                 回读、比对与核验
                                                                        │
                                                                        ▼
                                                                 Delivery Receipt
                                                                  实际交付回执
                                                                        │
                                                                        ▼
                                                              Metrics / Comment Draft
                                                              数据复盘与评论回复草稿
                                                                        │
                                                                        ▼
                                                               Recipe Update Proposal
                                                                 策略修订建议
                                                                        │
                                                                        ▼
                                                                   人工审核
                                                                        │
                                                                        └──► 新版 Profile / Recipe
```

**图中的 `DELIVER` 是能力分组，不代表渠道技能可以提前发布。**远程写入只能发生在授权之后；来源外发、工具权限和预算也在对应调用之前检查。内核不是最后才执行的一步，而是贯穿整条流程。

## 二、平台识别后，分别选择什么策略

下面是 `ChannelProfile → ContentRecipe` 的展开。**分组只是为了阅读方便，每个平台仍有独立的策略、内容形式和权限配置。**

```text
                              ChannelProfile
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
      LONG-FORM                 SOCIAL / VISUAL          VIDEO / SPOKEN
      长文与知识内容              社交与图文内容             视频与口播内容
          │                         │                         │
          ├── 微信公众号            ├── 小红书                  ├── 抖音
          │   读者问题              │   场景与搜索意图          │   明确主题
          │   → 论证与解释          │   → 实用笔记              │   → 真实开场
          │   → 微信排版            │   → 逐页卡片文案          │   → 演示与口播
          │                         │                         │
          ├── 知乎                  ├── 微博                    ├── 快手
          │   具体问题              │   事件与观点              │   具体使用场景
          │   → 回答与证据          │   → 简明表达              │   → 演示或有据故事
          │   → 反例与限制          │   → 必要来源              │   → 直接讲解
          │                         │                         │
          ├── 掘金                  ├── X                       ├── 视频号
          │   技术问题              │   核心观点                │   观众问题
          │   → 环境与步骤          │   → 短帖 / 串文 / 长文     │   → 可信讲解
          │   → 代码与验证          │   → 证据与上下文          │   → 分享语境
          │                         │                         │
          ├── 头条号                ├── LinkedIn                ├── TikTok
          │   读者兴趣              │   专业问题                │   目标语言与受众
          │   → 有据背景            │   → 真实案例与经验        │   → 开场与演示
          │   → 清晰解释            │   → 可执行启发            │   → 本地化口播
          │                         │                         │
          └── 百家号                ├── Instagram               └── B 站
              用户或搜索问题        │   视觉叙事                    受众问题
              → 结构化说明          │   → 卡片 / Caption / Reels    → 章节与演示
              → 来源与边界          │   → 文案与媒体需求            → 讲解与复盘
                                    │
                                    └── Reddit
                                        社区与具体问题
                                        → 社区规则
                                        → 实质回答与必要披露
```

每个 Profile 再根据请求选择具体 Recipe，例如：

```text
小红书
  ├── 原创笔记
  ├── 长文改编为笔记
  ├── 图文卡片文案
  └── 视频脚本

知乎
  ├── 问题回答
  ├── 独立文章
  └── 想法

B 站
  ├── 视频脚本
  ├── 专栏文章
  └── 动态
```

因此，**不是“小红书固定跑某五个技能”，而是“小红书 × 图文卡片 × 产品介绍”选择一套流程，“小红书 × 原创经验笔记”选择另一套流程。**

## 三、外部技能、自己的 Harness 和媒体工厂如何连接

技能池来自外部，但只有经过审查、锁定、安装及能力验证的技能，才允许进入运行时路由；SkillHub 搜索结果本身不等于已经集成的能力。

```text
                     外部技能来源与发现入口
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
      Baoyu Skills       Writing / Editorial   SkillHub / 渠道技能
          │                    │                    │
    URL → Markdown       Research Writer        平台选题与搜索
    YouTube Transcript   Content Strategy       渠道原生写作方法
    WeChat Digest        Product Marketing      趋势与数据读取
    Translate            Copywriting            内容结构分析
    Format Markdown      Social                 评论草稿辅助
    Markdown → HTML      Copy Editing           其他经过审查的能力
    WeChat / Weibo / X    Humanizer
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                        Skill Admission
                    来源 / 许可 / 依赖 / 行为审查
                               │
                               ▼
                        skills.lock.json
                    Release / Commit / 内容摘要
                               │
                               ▼
                       Managed Vendor Skills
                               │
                               ▼
                        content-harness
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         内容生产流程      VisualBrief       Media Brief
              │                │                │
              │                ▼                ▼
              │          Image Factory    外部视频／音频工厂
              │                │                │
              │          封面 / 插图       视频／音频生产
              │          卡片 / 信息图     按已验证能力调用
              │                │                │
              │                ▼                ▼
              │          AssetReceipt      Media Receipt
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                         Runtime Kernel
                    资产关联 / 版本核验 / 交付控制
```

这里的职责边界是：

**Content Factory 决定讲什么、为谁讲、在哪个平台讲、采用什么结构；外部 Skills 提供具体方法；Image Factory 等媒体工厂生产媒体；Runtime Kernel 保证事实、版本、授权和交付状态正确。**

当前这张图表达的是 **OpenSpec 的目标架构**。16 个渠道是内容生产覆盖目标；**公众号草稿是 V1 的真实交付核验重点，其他渠道不因存在发布技能就默认拥有公开发布权限。**

<!-- PRESENTATION-END -->

## 四、架构原则与权责

| 决策 | 采用方案 | 拒绝方案及理由 | 负责任务 |
|---|---|---|---|
| 编排入口 | 唯一 `content-harness`，Profiles/Recipes 是数据和参考 | 每渠道一个自建 Harness 会重复状态、提示词与升级工作 | CF-013、CF-045、CF-046 |
| 策略选择 | 写作前解析目标，按渠道×形式×任务×目标×语言选择 Recipe | 通用文章写完后再缩写无法保留原生平台意图 | CF-044–046、CF-050 |
| 技能供应链 | 独立来源审查、不可变锁、受控适配与运行时筛选 | 直接全量安装目录榜单无法证明许可、兼容性和权限边界 | CF-001、CF-043、CF-047–049 |
| 状态权威 | 内核服务负责事务，Skill 只返回候选结果 | 模型声明成功不能生成审批或核验回执 | CF-007、CF-011、CF-012、CF-032–034 |
| 多渠道 | 同源材料生成独立兄弟稿 | 文章→压缩笔记→再压缩脚本会累积信息丢失 | CF-019、CF-050、CF-052 |
| 媒体生产 | 图片委托 Image Factory，视频/音频为外部能力 | 内容插件重复内置生成后端会分裂预算、凭据与资产证据 | CF-006、CF-020、CF-021、CF-051 |
| 产品交付 | 工作稿、已验证导出、核验草稿分开 | “点击成功”“已写正文”不等于远端交付成功 | CF-024、CF-030、CF-036、CF-053 |

Runtime Kernel 是受支持工具路径的权责边界，不是宿主原生 shell 的绝对安全沙箱。候选 Skill 不得通过直接读写数据库、调用另一发布脚本或切换高权限浏览器来绕过该边界；执行环境须限制其可见工具、目录和凭据。无法隔离的宿主组合要标明能力限制。

## 五、工程模块和依赖方向

```text
packages/cli, packages/mcp          入口与宿主协议适配
                ↓
packages/core/src/application       用例编排与统一命令结果
                ↓
channels + skills + content         Context/Profile/Recipe/Binding/Revision
                ↓
ports                              外部能力接口
                ↑
adapters                           Baoyu、宿主、朱雀、微信、Image Factory

profiles/channels + recipes         可版本化配置数据
skills/content-harness              唯一本地 Skill；不得直接改数据库
skills.lock.json + vendor           完整外部技能及不可变来源
```

模块实际建成后通过导入依赖测试约束：core 只依赖端口和数据契约，不反向导入 CLI/MCP，也不直接依赖某个供应商脚本；不同宿主共享领域服务，入口层不可另造绕过门禁的发布捷径。

| 模块 | 责任路径（待实施） | 所有权与对外结果 |
|---|---|---|
| 宿主探测与入口 | `adapters/host/`、`packages/cli/src/main.ts`、`packages/mcp/src/server.ts` | 无付费探测，返回真实可用能力及限制 |
| 渠道解析与流程 | `packages/core/src/channels/`、`profiles/channels/`、`recipes/` | 解析证据、路由决策、版本化执行图 |
| 技能准入与调用 | `packages/core/src/skills/`、`adapters/content-methods/`、`vendor/` | 候选与有效绑定隔离；完整脚本/引用依赖 |
| 来源、正文与事实 | `packages/core/src/content/`、`packages/core/src/content/`、`packages/core/src/review/` | 不可变来源/稿件/差异/事实检查 |
| 执行与预算 | `packages/core/src/workflow/`、`packages/core/src/security/` | 检查点、调用意图、保留/消耗/释放预算 |
| 检测 | `packages/core/src/detection/`、`adapters/zhuque/` | 原始响应、解释、适用性、版本有效性 |
| 排版与资产 | `packages/core/src/render/`、`packages/core/src/assets/`、`adapters/image-factory/` | 冻结文字、资产哈希、图片需求与回执 |
| 交付 | `packages/core/src/delivery/`、`adapters/wechat/` | 可信审批、持久意图、远端 ID、回读差异 |
| 复盘 | `packages/core/src/channels/feedback.ts` | 有出处的数据与评论草稿；只提出策略变更 |

## 六、核心契约与状态所有权

以下为待实现的数据契约；字段名和枚举进入 Schema 后须由 CLI、MCP、适配器共同使用。引用使用 `{id, revision, hash}`，不可把可变文件路径视为内容身份。

| 对象 | 必需字段 | 关键不变量 |
|---|---|---|
| HostContext | host_id、host_version、os、available_tools、browser_modes、filesystem_scope、credential_refs、probe_evidence | unknown 不等于 supported；版本与浏览器模式不能猜 |
| SourceContext | source_id、source_platform、uri、read_at、locator、access_scope、content_hash | 来源网址不代表目标账号或发布授权 |
| ChannelIntent | channel_id、format_id、locale、audience、goal、task_kind、requested_action、account_ref、resolution_state、resolution_evidence | 写稿可暂不绑定账号；远程写入必须绑定明确账号 |
| ChannelProfile | id、revision、aliases、formats、locales、strategy_refs、constraints、validation_refs | 策略偏好与平台硬规则分开，硬规则要来源/日期/适用范围 |
| ContentRecipe | id、revision、selection_key、stages、quality_gates、fallback_policy | stages 为有向无环图，每步有输入输出、端口、门禁、重试和检查点 |
| SkillBinding | capability_id、source_identity、locked_version、effective_hash、host_constraints、permissions、cost_class、output_schema、evidence_refs | 搜索命中不等于 installed/contract_verified/live_verified |
| RoutingDecision | input_hash、context_refs、profile_revision、recipe_revision、selected_bindings、rejected_reasons、status | 记录实际选择及拒绝理由，恢复不得静默采用新版策略 |
| SourceBundle / ClaimRegistry | source_refs、claims、locators、support_status、rights_notes | 支持、冲突、用户陈述、未验证分开，不凭空补数据 |
| ChannelVariant | content_id、revision、channel、format、locale、source_bundle_ref、profile_ref、recipe_ref、asset_refs | 同源兄弟稿独立；共享存储不共享授权 |
| VisualBrief / MediaBrief | request_id、variant_ref、anchor、kind、purpose、constraints、source_refs、budget_ref、consent_ref | 缺外部能力只输出需求，不伪造生成结果 |
| AssetReceipt | request_id、producer、asset_hash、media_type、size、provenance、usage、status | 文件真实存在且哈希匹配；错误或旧稿资产不可绑定 |
| DetectionRecord | variant_ref、scope、submitted_hash、text_hash、provider_config_hash、raw_ref、policy_ref、status、verdict | 文本、请求状态、策略结果和人工判断分开 |
| Approval / DeliveryIntent | bundle_hash、variant_ref、account_ref、action、policy_version、user_confirmation_ref、intent_id | 审批来自可信交互而非模型字段，执行前再核对对象 |
| DeliveryReceipt | intent_id、remote_id、readback_ref、normalized_diff、status、checked_at | 保存未核验与 verified_draft 分开；unknown 先对账 |
| MetricObservation / RecipeProposal | channel、account、content、definition、unit、denominator、period、sampled_at、source、proposed_recipe_ref | 缺失不等于零；反馈不能自动改策略或发评论 |

执行端口统一结构：

```typescript
// 目标接口形状；不是当前已发布 SDK。
type Ref = { id: string; revision: number; hash: string };
type StageStatus = 'succeeded' | 'blocked' | 'failed' | 'unknown' | 'cancelled';
type StageRequest = {
  runId: string; stepId: string; routingRef: Ref; inputRefs: Ref[];
  expectedVariant?: Ref; consentRef?: Ref; budgetReservationRef?: Ref;
};
type StageResult = {
  status: StageStatus; artifactRefs: Ref[]; evidenceRefs: Ref[];
  retry: 'never' | 'safe_after_backoff' | 'reconcile_first';
  errorCode?: string;
};
interface StagePort { execute(request: StageRequest): Promise<StageResult>; }
```

Skill 返回候选 Artifact；内核检查 provenance、Schema、权限、预算和事实后才能 CAS 提升正文 head。单阶段成功只说明该阶段，不同时设置内容审批、检测通过和交付成功。

## 七、平台与形式覆盖契约

以下 16 个 channel_id 与现有档案一致；每个声明的 format 都必须有显式 Recipe 和回归样例，不能只放一个空 Profile。策略组不是排他类型，例如 B 站同时有文章、动态与视频脚本。

| channel_id | 声明的 format_id |
|---|---|
| wechat-article | article、image_text |
| xiaohongshu | note、carousel_copy、video_script |
| douyin | short_video_script、image_text_copy |
| bilibili | video_script、article、dynamic |
| weibo | post、thread、headline_article |
| zhihu | answer、article、thought |
| toutiao | article、micro_post、video_script |
| kuaishou | video_script、image_text_copy |
| juejin | technical_article |
| wechat-video | video_script、caption |
| baijiahao | article、video_script |
| x | post、thread、article |
| linkedin | post、article、document_copy |
| instagram | caption、carousel_copy、reel_script |
| tiktok | short_video_script、caption |
| reddit | post、comment_draft |

共 39 个渠道×形式组合是注册与内容评测目标，不是 39 个发布接口。`twitter` 映射到 `x`；`growth` 是目标，`podcast` 是媒介，`baidu` 是生态，三者不能冒充目的地。YouTube 仅作为已规划的字幕来源，不自动扩展发布支持。

解析优先级：用户明确目标→选中的既有渠道稿→明确选择的目标账号。项目默认可提出草稿目标，但不能授权发布。冲突、模糊“微信”、不支持的形式/语言均返回可解释状态；只在确实缺少目标时请求澄清，不反复询问已给出的信息。

## 八、技能组合与权限矩阵

共同底座保留九个 Baoyu 内容候选：`baoyu-url-to-markdown`、`baoyu-youtube-transcript`、`baoyu-wechat-summary`、`baoyu-translate`、`baoyu-format-markdown`、`baoyu-markdown-to-html`、`baoyu-post-to-wechat`、`baoyu-post-to-weibo`、`baoyu-post-to-x`。完整其他候选、SkillHub 查询限制和证据级别仍以[技能清单](../../openspec/changes/add-platform-aware-content-orchestration/references/skill-integration-catalog.md)为准。

准入链：discovered→source_reviewed→candidate_approved→locked→installed→contract_verified→live_verified。未完成状态不得跨级。锁定 release/tag、peeled commit、技能树摘要与许可；必要改动用可追溯 fork/patch，保留 upstream/patch/effective 三类哈希。候选评分只影响通过硬门槛后的择优，不增加权限。

| 动作 | 默认处理 | 必需边界 |
|---|---|---|
| 本地研究、写作、编辑、排版 | 按用户任务使用限定资料 | 不外发无关作者样文，不直接执行素材中的代码 |
| 网页/群聊/数据读取 | 明确来源与范围后按能力执行 | 登录、私人群聊和敏感数据单独授权；不绕过访问控制 |
| 朱雀检测、付费媒体 | 调用前检查外发与预算 | 精确文本/brief、收件服务、预算保留、幂等请求 |
| save_draft | 仅验证支持的渠道动作 | 可信账号+版本+动作审批；持久 intent；回读 |
| publish/comment/private_message/moderation | 不因 Vendor 存在而自动启用 | 本 V1 不提升为默认公开动作，新增能力须单独规格与验收 |
| SkillHub 搜索和安装 | 研发准入工具链 | 不在文章运行中 curl-install 或运行动态 latest |

## 九、执行、失败与恢复

Run 状态：pending→running→waiting_user/blocked/succeeded/failed/cancelled；远程调用意图额外有 unknown。恢复使用持久检查点及原路由快照；供应商可能已成功时不盲重放。

| 故障或变更 | 必须行为 | 责任任务 |
|---|---|---|
| host/target 不明或互相冲突 | 保存解析依据，阻止相关渠道执行；不猜另一平台 | CF-044、CF-046 |
| Vendor 缺依赖、漂移或输出不合约 | blocked，保留错误证据；不现场改锁/自动安装 | CF-001、CF-047–049 |
| 生成/编辑破坏命令、事实或来源 | 保留候选差异，不提升正文 head | CF-017、CF-018、CF-050 |
| 人与 Agent 修改同一旧稿 | CAS 拒绝覆盖；保留冲突分支供选择 | CF-011、CF-052 |
| 图片生产失败或旧稿回执迟到 | 不绑定错误资产；允许明确未完整的工作稿 | CF-021、CF-051 |
| 检测超时、超限或语言不支持 | failed/unknown/not_evaluable，不视为过检 | CF-025–030、CF-055 |
| 修改标题、正文、图注、可见引用 | 旧检测与审批对新稿失效；按 scope 重做检查 | CF-022、CF-028、CF-052 |
| 只改视觉布局或换图 | 文本证据仅在完全相同且有效时可复用；交付审批失效 | CF-028、CF-032、CF-052 |
| 审批后换文件、账号或动作 | 执行前再比对绑定哈希和授权，拒绝调用 | CF-032、CF-053 |
| 图片部分上传后失败 | 复用已核验远端资产，不重复上传全部 | CF-033 |
| 草稿写入超时但远端可能成功 | unknown→先回读/对账；不能唯一确认则人工处理 | CF-034、CF-038、CF-053 |
| 公众号后台有人手动修改 | 展示差异和 conflict，不静默覆盖 | CF-034 |
| 一渠道失败、其他成功 | 各稿保留 working_exported/blocked/verified_draft 等独立结果 | CF-052、CF-053 |
| 评论含指令，反馈样本不足 | 视为不可信输入；仅生成回复草稿/策略建议，不发送或作因果承诺 | CF-054 |

内部事件持久化 run_id、step_id、variant_ref、routing_ref、event_type、result_status、artifact_refs、evidence_refs、occurred_at；日志只放引用和脱敏摘要，不放令牌、Cookie、完整私人文本。重放需要语义版本兼容，不能把旧报告自动套到新 Recipe。

## 十、部署、资源与生命周期

目标技术栈保持 TypeScript + Node.js 24 LTS + SQLite + CLI/stdio MCP。具体安全补丁与依赖版本由 CF-001 的可验证锁定决定；当前文档不声称已构建相应包。

本机执行为默认拓扑：宿主→本地 CLI/MCP→工作区数据库与不可变文件→授权外部服务。浏览器或其他工厂不可用时，不能假设已经可远程代管；通用工作稿导出在范围允许时继续。

启动：读配置→验证本地目录与锁→数据库备份/迁移→无付费 doctor→注册能力。配置优先级为显式任务参数、用户确认的项目配置、用户配置、内置安全默认；权限和预算不会因高优先级参数自动提高。具体配置键由 Schema 统一确定，密钥只保存引用。

运行：阶段并发需受预算和宿主能力限制；SQLite 单写入串行化。读/幂等调用仅做有限退避；可能写入成功的调用优先对账。本文不编造吞吐、延迟或资源实测值；文件大小、超时、并发、自动编辑次数和调用预算均为必填可验证限制，边界测试由 CF-009、CF-029、CF-038 负责。

停止与恢复：停止接收新任务，持久未决 intent，安全关闭数据库；重启后检查原 artifact 与回执，不能重复已经支付的步骤。升级前备份数据库及版本清单，迁移失败保留旧工作区；卸载与清理私人材料须有明确选择，不默认删除作品。

## 十一、可验证实施路线

[OpenSpec 执行计划](../../openspec/changes/implement-content-factory-architecture/plan.md)将 58 个原父任务细化为可执行子项，每项包含责任文件、输入输出、显式依赖、正反例、验证命令和证据路径。[追踪表](../../openspec/changes/implement-content-factory-architecture/traceability.md)把所有父任务映射到本文件章节，任务索引可用于检查缺漏与环。

实施顺序不等于数值编号顺序：先供应链、入口、存储及外部契约探测，再 Context/Profile/Recipe/Binding、内容与资产、检测与交付，最后复盘与质量、宿主验收及同版本发行。CF-058 是 CF-042 的前置门槛，不能反向制造发行依赖环。

任何一项文档、目录或 JSON 的存在均不等于该能力实现。测试需区分静态、fixture、真实供应商、真实宿主、内容人工审阅；授权缺失记 NOT_RUN/BLOCKED，不计为通过。30 篇原基准、16 渠道与全部 39 形式、R01–R42、旧故障与 P0 门槛同时保留。

## 十二、来源与更新规则

本文件为现有两个未归档变更的完整架构阅读入口，不覆盖原需求原文。发生冲突必须写明更改理由和受影响任务，不能借整理文档悄悄减范围。

- [V1 设计与业务约束](../../openspec/changes/establish-content-factory-v1/design.md)
- [V1 父任务](../../openspec/changes/establish-content-factory-v1/tasks.md)
- [平台感知设计](../../openspec/changes/add-platform-aware-content-orchestration/design.md)
- [16 渠道完整档案](../../openspec/changes/add-platform-aware-content-orchestration/references/channel-profiles.md)
- [技能候选与准入证据](../../openspec/changes/add-platform-aware-content-orchestration/references/skill-integration-catalog.md)
- [渠道验收 R01–R42](../../openspec/changes/add-platform-aware-content-orchestration/acceptance.md)
- [渠道父任务 CF-043–058](../../openspec/changes/add-platform-aware-content-orchestration/tasks.md)

渠道算法、字符/图片上限、检测供应商字段、账号权限和工具版本等外部事实必须在真正实施/调用时核对来源日期与适用范围；不把作者策略偏好写成平台官方结论。保留候选未知项，不虚构已锁定的版本。
