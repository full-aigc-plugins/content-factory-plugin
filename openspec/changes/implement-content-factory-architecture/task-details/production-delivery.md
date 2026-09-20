# production-delivery 详细任务卡

全部 NOT_STARTED。子项状态在 [tasks.md](../tasks.md)；不重复创建父任务。先读完整架构和原变更，以下测试命令均为实施入口，不是已执行结果。

<a id="cf-020"></a>
## CF-020 — 配图计划、现有图片导入与资产权属

**依赖：** CF-011、CF-017。

**文件：** `packages/core/src/content/assets.ts`、`schemas/visual-brief.schema.json`、`skills/content-harness/references/visual-brief.md`。

**输入：** 段落 anchor、用户图/截图、使用说明。

**输出：** VisualBrief 与 AssetRecord。

**验收：** 生成图不得标真截图；损坏图片、错 MIME、超大尺寸、缺使用说明标出风险。

**约束：** 无图也可出工作稿；用户明确选择无图才能完成相应正式内容策略。

**反例：** 把用户截图标为生成图或缺授权素材标为自有；资产分类检查拒绝。

**验证命令：** `npm run test -- tests/integration/assets.test.ts`。

**证据：** `docs/verification/tasks/CF-020.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-021"></a>
## CF-021 — 图片工厂受控调用与回执接收

**依赖：** CF-006、CF-012、CF-020。

**文件：** `adapters/image-factory/bridge.ts`、`packages/core/src/security/generation-approval.ts`。

**输入：** VisualBrief、宿主 capability、预算批准。

**输出：** 验证过的图像、哈希、generation receipt。

**验收：** 拒绝费用不调用；超时不自动再生；模型名称未返回记录 unknown；尺寸需求不假装受控。

**约束：** 直接复用上游生产与恢复纪律；用户提供图片为正式可用替代路径。

**反例：** 图片生产完成但本地响应丢失；先查 request_id 回执，不重复付费生成。

**验证命令：** `npm run test -- tests/integration/image-generation.test.ts`。

**证据：** `docs/verification/tasks/CF-021.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-022"></a>
## CF-022 — 确定性 Markdown/HTML 渲染与文字冻结

**依赖：** CF-005、CF-011、CF-017、CF-020。

**文件：** `adapters/content-methods/format.ts`、`packages/core/src/render/pipeline.ts`、`packages/core/src/render/canonical-text.ts`。

**输入：** 已冻结正文、标题摘要、图片图注、引用。

**输出：** ChannelVariant、通用 HTML、微信 HTML、detection text。

**验收：** 无新标题摘要；代码和链接无变更；外链转引用在冻结前；检测内容包含全部可见文字。

**约束：** canonicalization 版本化；sanitization 不允许脚本和危险协议。

**反例：** 微信外链转文末引用改变可见文字；先完成转换再冻结 text_hash。

**验证命令：** `npm run test -- tests/integration/render-text.test.ts`。

**证据：** `docs/verification/tasks/CF-022.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-023"></a>
## CF-023 — 三套主题与手机排版回归

**依赖：** CF-022。

**文件：** `templates/simple/`、`templates/technical/`、`templates/brand/`、`packages/core/src/render/theme.ts`。

**输入：** 主题参数、长文章、表格/代码/中英混排。

**输出：** 375/390/430/1280 宽度可读渲染。

**验收：** 图片无溢出；长代码可阅读；标题层级明确；品牌色只改变样式不改文字。

**约束：** 样式与内容分开；不强求微信 HTML 支持浏览器所有 CSS。

**反例：** 375/390/430px 下长代码与表格；不溢出导致正文不可读，记录实际截图。

**验证命令：** `npm run test -- tests/e2e/themes.test.ts`。

**证据：** `docs/verification/tasks/CF-023.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-024"></a>
## CF-024 — 本地审阅报告与修订比较

**依赖：** CF-017、CF-018、CF-022、CF-023。

**文件：** `packages/core/src/render/review-page.ts`、`templates/review/`。

**输入：** 正文、差异、来源、报告与状态。

**输出：** 五区域审阅 HTML，工作稿与已验证包状态清晰。

**验收：** 报告无远程跟踪代码；私密材料不泄漏到公开 HTML；打开预览不触发网络写入。

**约束：** UI 只展示与导航；批准通过宿主/CLI 内核受控入口记录。

**反例：** 审阅页面打开过期版本；明确标记，不拿旧报告与新正文拼在一起。

**验证命令：** `npm run test -- tests/e2e/review-preview.test.ts`。

**证据：** `docs/verification/tasks/CF-024.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-025"></a>
## CF-025 — 朱雀 HTTP 适配与原始证据存储

**依赖：** CF-003、CF-007、CF-012、CF-022。

**文件：** `packages/core/src/detection/zhuque.ts`、`packages/core/src/detection/store.ts`、`adapters/zhuque/client.ts`。

**输入：** DetectorRequest、精确 UTF-8 文本、外发许可。

**输出：** DetectionJob 与不可变 raw response。

**验收：** 无授权不发正文；HTTP成功但业务状态失败不得 succeed；响应模式变化给契约错误。

**约束：** 仅从 secret provider 获取密钥；未知字段保留，必要字段缺失阻断解释。

**反例：** 缺凭据、业务失败或格式漂移；记 failed/unknown，不模拟检测成功。

**验证命令：** `npm run test -- tests/contract/zhuque-adapter.test.ts`。

**证据：** `docs/verification/tasks/CF-025.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-026"></a>
## CF-026 — 分类比例解释与 Unicode 分段定位

**依赖：** CF-025。

**文件：** `packages/core/src/detection/normalize.ts`、`packages/core/src/detection/segments.ts`。

**输入：** 真实供应商 raw fixture、canonical text。

**输出：** normalized report、可信位置映射或未定位提示。

**验收：** AI/疑似/置信度分别显示；Emoji 和组合字符不错误高亮；分块不平均伪造全文结果。

**约束：** 保存供应商原文；未证实位置语义时用文本匹配并提示歧义。

**反例：** UTF-16 与 Unicode 字符位置不一致；不能高亮错误段，降级展示供应商原段。

**验证命令：** `npm run test -- tests/integration/detection-segments.test.ts`。

**证据：** `docs/verification/tasks/CF-026.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-027"></a>
## CF-027 — 检测政策、人工例外与交付门槛

**依赖：** CF-025、CF-026、CF-017。

**文件：** `packages/core/src/detection/policy.ts`、`packages/core/src/review/approval.ts`、`schemas/detection-policy.schema.json`。

**输入：** review/threshold 策略、真实报告、人工裁定。

**输出：** policy_verdict 与 review_decision 分离。

**验收：** 未配置阈值不自造 X%；请求失败不能通过；exception 不改写 not_met；未知字段 not_evaluable。

**约束：** 默认 review；approved 含明确主体、动作、策略版本，不接受任意模型自报。

**反例：** 人工例外接受一个策略失败稿；原 verdict 仍为未满足，不改成 passed。

**验证命令：** `npm run test -- tests/integration/detection-policy.test.ts`。

**证据：** `docs/verification/tasks/CF-027.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-028"></a>
## CF-028 — 报告失效、请求去重与时效政策

**依赖：** CF-011、CF-022、CF-025、CF-027。

**文件：** `packages/core/src/detection/freshness.ts`、`packages/core/src/workflow/invalidation.ts`。

**输入：** 版本变更、text_hash、主题与账号变化。

**输出：** 可复用或失效原因及下游待办。

**验收：** 正文变更检测失效；仅CSS变更可复用检测却需重审交付；跨Run默认不复用；到期显式重检。

**约束：** 文本规范版本与请求配置纳入 key；不假定供应商未知模型永不改变。

**反例：** 只改标题或摘要；旧检测和对应审批对新稿失效。

**验证命令：** `npm run test -- tests/integration/invalidation.test.ts`。

**证据：** `docs/verification/tasks/CF-028.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-029"></a>
## CF-029 — 费用、额度、重试与取消

**依赖：** CF-025、CF-012。

**文件：** `packages/core/src/security/budgets.ts`、`packages/core/src/detection/retry.ts`。

**输入：** 请求类型、预算、Retry-After、实际 usage。

**输出：** 可追溯 attempt 与额度消耗。

**验收：** 429最多两次重试；401不重试；额度不足 blocked；费用未知不是零；取消后不新发请求。

**约束：** 网络重试可能计费，保存每次尝试；图像与远程写入不复用检测重试策略。

**反例：** 429/Retry-After、取消、额度耗尽；有限重试并释放未用预算，不抹掉已发生费用。

**验证命令：** `npm run test -- tests/integration/budgets.test.ts`。

**证据：** `docs/verification/tasks/CF-029.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-030"></a>
## CF-030 — 完整检测报告与真实对照样本

**依赖：** CF-024、CF-026、CF-027、CF-028、CF-029。

**文件：** `packages/core/src/render/detection-report.ts`、`docs/verification/detection-live.md`。

**输入：** 最终渠道稿与已授权测试集合。

**输出：** 页面/JSON 报告和 live evidence。

**验收：** 人工/原始AI/编辑稿各有真实检测记录；不以低分作为插件质量证明；没有官方PDF不伪造官方报告。

**约束：** 自建报告明确标为基于API结果整理；网页与API一致性未经对照不作承诺。

**反例：** 只有 fixture 没有真实样本；报告明确 NOT_RUN，不能作为 live 准入证据。

**验证命令：** `npm run test -- tests/e2e/detection-flow.test.ts`。

**证据：** `docs/verification/tasks/CF-030.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-031"></a>
## CF-031 — 账号、凭据与交付权限预检

**依赖：** CF-004、CF-007、CF-012。

**文件：** `packages/core/src/delivery/accounts.ts`、`packages/core/src/security/credentials.ts`、`packages/core/src/delivery/preflight.ts`。

**输入：** 账号别名、credential_ref、用户选择。

**输出：** 可执行交付方式与权限诊断。

**验收：** 不输出AppSecret/Cookie；换账号重新批准；无权限不静默改成另一个账号。

**约束：** 系统凭据优先；环境变量为明确回退，不在项目保存秘密。

**反例：** 选定 A 账号但凭据解析为 B；在任何远端写入前拒绝。

**验证命令：** `npm run test -- tests/integration/account-preflight.test.ts`。

**证据：** `docs/verification/tasks/CF-031.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-032"></a>
## CF-032 — 冻结交付包与受控审批记录

**依赖：** CF-021、CF-024、CF-027、CF-028、CF-031。

**文件：** `packages/core/src/delivery/prepare.ts`、`packages/core/src/delivery/intents.ts`、`packages/core/src/delivery/approve.ts`。

**输入：** ChannelVariant、asset hashes、检测审阅、目标账号。

**输出：** ReleaseBundle、DeliveryIntent、Approval。

**验收：** 审批后正文/封面被替换则拒绝；账号不同拒绝；模型自报批准不成立；无可信交互批准通道只能prepare；工作稿不能冒充 verified。

**约束：** 审批约束的是规范化逻辑内容包；图片远端URL仅允许受控映射。

**反例：** 批准后替换正文、图片或目标账号；bundle_hash/授权绑定检查阻断写入。

**验证命令：** `npm run test -- tests/integration/delivery-approval.test.ts`。

**证据：** `docs/verification/tasks/CF-032.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-033"></a>
## CF-033 — Baoyu 微信渠道适配与持久提交意图

**依赖：** CF-004、CF-031、CF-032。

**文件：** `adapters/wechat/api.ts`、`packages/core/src/delivery/submit.ts`、`packages/core/src/delivery/asset-map.ts`。

**输入：** DeliveryRequest、批准的bundle、真实账号。

**输出：** remote draft ID 或 failed/unknown；每次请求摘要。

**验收：** 图片部分成功可恢复；写入超时不盲重试；只创建草稿不触发群发；重复提交本地去重。

**约束：** 先持久化intent；防止TOCTOU；不得宣称远程 exactly-once。

**反例：** 图片部分上传后超时；保存已上传资产映射，草稿结果可能成功时记 unknown。

**验证命令：** `npm run test -- tests/integration/wechat-submit.test.ts`。

**证据：** `docs/verification/tasks/CF-033.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-034"></a>
## CF-034 — 草稿回读、冲突与更新

**依赖：** CF-033。

**文件：** `adapters/wechat/readback.ts`、`packages/core/src/delivery/verify.ts`、`packages/core/src/delivery/update.ts`。

**输入：** 草稿 ID、批准bundle、平台读取结果。

**输出：** DeliveryReceipt、字段差异与 verified/conflict 状态。

**验收：** 外部人工改稿可检测；标题/摘要/正文/图片顺序不同不通过；重复恢复不新建稿。

**约束：** 回读按明确渠道规范归一化，不能删除实质差异来“对齐”。

**反例：** 草稿成功但响应丢失或后台人工改稿；先对账，发现差异记 conflict，不再创建。

**验证命令：** `npm run test -- tests/integration/wechat-readback.test.ts`。

**证据：** `docs/verification/tasks/CF-034.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-035"></a>
## CF-035 — 受控浏览器草稿路径

**依赖：** CF-031、CF-032、CF-034。

**文件：** `adapters/wechat/browser.ts`、`docs/guides/wechat-browser.md`。

**输入：** 用户授权登录会话、最终稿、明确草稿动作。

**输出：** 已填入/已保存/已核验三类证据。

**验收：** 登录过期/验证码停下交给用户；编辑器DOM变化失败可恢复；没有回读不算 verified。

**约束：** 浏览器能力与操作系统单独标支持；只回退用户明确选择的账号。

**反例：** 登录过期、验证码或 DOM 变化；停在用户可恢复步骤，不偷偷换浏览器权限模式。

**验证命令：** `npm run test -- tests/e2e/wechat-browser.test.ts`。

**证据：** `docs/verification/tasks/CF-035.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-036"></a>
## CF-036 — 工作稿/已验证交付包导出

**依赖：** CF-024、CF-030、CF-032、CF-034。

**文件：** `packages/core/src/delivery/export.ts`、`packages/core/src/delivery/manifest.ts`。

**输入：** variant、export kind、合法目标路径。

**输出：** Markdown/HTML/微信HTML/资产/清单/报告/回执包。

**验收：** 缺图/缺检测不能出 verified；敏感来源不默认打包；全部哈希可重新验证；无远程写入也可本地交付。

**约束：** 导出至新目录；冲突不覆盖；公开内容包与内部审计包分开。

**反例：** 缺图/缺必需检测导出 verified；拒绝；working 包显式列缺项且不混入私人来源。

**验证命令：** `npm run test -- tests/e2e/export.test.ts`。

**证据：** `docs/verification/tasks/CF-036.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-037"></a>
## CF-037 — 安全与供应链专项验证

**依赖：** CF-001、CF-009、CF-010、CF-031、CF-036。

**文件：** `tests/security/`、`scripts/audit-release.mjs`、`docs/verification/security.md`。

**输入：** 可安装包、恶意素材、凭据哨兵、路径攻击样本。

**输出：** 无密钥/正文泄漏；许可与依赖扫描证据。

**验收：** SSRF、symlink逃逸、XSS、恶意文档、secret日志、审批伪造、错误账号全部阻断。

**约束：** 模型可用原生shell属于宿主信任边界；本地内核是受支持工作流门禁，不宣称绝对沙箱。

**反例：** SSRF、路径逃逸、XSS、凭据哨兵和伪审批；均不可越权且日志不含 secret。

**验证命令：** `npm run test -- tests/security/release-security.test.ts`。

**证据：** `docs/verification/tasks/CF-037.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-038"></a>
## CF-038 — 崩溃、重复提交与依赖故障回归

**依赖：** CF-012、CF-028、CF-029、CF-033、CF-034。

**文件：** `tests/chaos/`、`docs/verification/recovery.md`。

**输入：** 每阶段故障注入、数据库备份与外部未知结果。

**输出：** 可解释恢复、无误报成功、重复写入计数。

**验收：** 进程强杀/断网/空间耗尽/锁竞争/未知写入/外部改稿/供应商格式漂移覆盖。

**约束：** 故障注入和真实事故证据分开；不为了测试故意耗尽真实付费额度。

**反例：** 强杀、断网、磁盘满、锁竞争、远端未知写入；不误报成功、不覆盖作品。

**验证命令：** `npm run test -- tests/chaos/end-to-end-recovery.test.ts`。

**证据：** `docs/verification/tasks/CF-038.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-039"></a>
## CF-039 — 30篇内容评测与编辑质量回归

**依赖：** CF-018、CF-019、CF-023、CF-030、CF-036。

**文件：** `tests/fixtures/corpus/manifest.json`、`docs/verification/editorial-benchmark.md`。

**输入：** 五种类型各六篇授权或自有样本。

**输出：** 30篇审阅记录；严重事实错误=0；至少27篇无需重写结构。

**验收：** 每篇同时检查事实、自然度、用途、排版；保留人工判定，不用检测低分替代。

**约束：** 30与27为产品验收目标不是实测成绩；至少两名审阅者或所有者加独立复核。

**反例：** 30 篇评测出现严重新增事实；门槛失败，检测低分不得抵消编辑错误。

**验证命令：** `npm run test -- tests/e2e/corpus.test.ts`。

**证据：** `docs/verification/tasks/CF-039.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-040"></a>
## CF-040 — 三操作系统安装与资源迁移

**依赖：** CF-037、CF-038。

**文件：** `tests/install/`、`.github/workflows/ci.yml`、`docs/verification/os-matrix.md`。

**输入：** macOS/Windows/Linux干净用户目录与发行包。

**输出：** CLI/数据库/渲染/导出/恢复安装证据。

**验收：** 无开发机绝对路径；非ASCII用户名；无Bun；SQLite binding无需现场编译；升级备份可恢复。

**约束：** 操作系统自动测试不等于各宿主真实外部功能已支持。

**反例：** 非 ASCII 用户名、无 Bun、干净三系统；失败组合记 unsupported 而非跳过后通过。

**验证命令：** `npm run test -- tests/install/clean-install.test.ts`。

**证据：** `docs/verification/tasks/CF-040.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-041"></a>
## CF-041 — 三宿主实装与真实端到端验收

**依赖：** CF-030、CF-034、CF-036、CF-039、CF-040。

**文件：** `docs/verification/host-matrix.md`、`docs/verification/live-run-index.json`。

**输入：** Codex/ZCode/Kimi具体版本与操作系统；授权测试账号。

**输出：** 每宿主新会话主链证据、精确能力矩阵、三份manifest校验。

**验收：** 每宿主从素材到检测/导出及草稿回读跑通；图像能力缺失明确；NOT_RUN不写成支持。

**约束：** 必要时差异适配，不能靠复制JSON宣称兼容；远程证据需按host标记。

**反例：** 仅 manifest 存在而未启动宿主；兼容状态为 NOT_RUN。

**验证命令：** `npm run test -- tests/e2e/host-contract.test.ts`。

**证据：** `docs/verification/tasks/CF-041.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-042"></a>
## CF-042 — 发行包、市场登记、文档与最终门禁

**依赖：** CF-001、CF-035、CF-037、CF-038、CF-039、CF-040、CF-041、CF-058。

**文件：** `README.md`、`README.zh-CN.md`、`CHANGELOG.md`、`docs/guides/`、`scripts/release-gate.mjs`。

**输入：** 所有P0证据、同一commit/tag/package、支持矩阵。

**输出：** v1.0.0 候选发布清单与完成核验的最终发行包。

**验收：** 每项P0有 evidence_ref；mock/live分开；包无秘密；市场版本一致；干净安装同SHA。

**约束：** 只对目标市场仓的已确认 catalog 入口另行做同版本发布；文档任务不发布产品版本。

**反例：** 任何旧或新增门槛缺证据/不同 SHA；阻止 v1.0.0 和市场更新。

**验证命令：** `npm run test -- tests/contract/release-gate.test.ts`。

**证据：** `docs/verification/tasks/CF-042.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

