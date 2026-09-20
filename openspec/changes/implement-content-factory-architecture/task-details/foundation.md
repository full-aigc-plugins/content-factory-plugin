# foundation 详细任务卡

全部 NOT_STARTED。子项状态在 [tasks.md](../tasks.md)；不重复创建父任务。先读完整架构和原变更，以下测试命令均为实施入口，不是已执行结果。

<a id="cf-001"></a>
## CF-001 — 不可变 Vendor 供应链与发行结构

**依赖：** 无。

**文件：** `skills.lock.json`、`plugin-local-skills.json`、`THIRD_PARTY_NOTICES.md`、`package.json`、`scripts/sync-skills.mjs`、`scripts/check-skills.mjs`。

**输入：** 经审查的来源包、许可证、release/tag 与 peeled commit。

**输出：** skills.lock.json、唯一 content-harness 本地清单、同步与离线完整性检查。

**验收：** tag 移动、摘要漂移、缺许可、未声明 Skill 必须失败；同步不得覆盖本地 Harness。

**约束：** 只纳入许可清晰的必要文件；生产禁用动态 latest 安装。

**反例：** 修改一个受管 Skill 文件或移动 tag；check-skills 返回非零且本地 Harness 字节不变。

**验证命令：** `npm run test -- tests/contract/manifests.test.ts`。

**证据：** `docs/verification/tasks/CF-001.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-002"></a>
## CF-002 — CLI/MCP 引导与宿主能力探测

**依赖：** CF-001。

**文件：** `packages/cli/src/main.ts`、`packages/mcp/src/server.ts`、`adapters/host/probe.ts`、`tests/support/cli.ts`、`packages/core/src/ports/stage.ts`、`schemas/stage-result.schema.json`、`tests/support/architecture-case.ts`。

**输入：** Node24、工作区、宿主可执行环境。

**输出：** doctor JSON 与统一错误格式；MCP 与 CLI 同一 domain service；建立 StageRequest/StageResult/StagePort 和 CaseSpec 测试基架。

**验收：** 无生图/无搜索时显式 unavailable；未知宿主不宣称支持；doctor 不发起费用调用。

**约束：** 建立 npm test/lint/typecheck/build；配置 host manifest 与 tool discovery。

**反例：** 探测未知宿主、缺浏览器、缺图片工具；输出 unknown/unavailable，付费调用计数为 0。

**验证命令：** `npm run test -- tests/contract/doctor.test.ts`。

**证据：** `docs/verification/tasks/CF-002.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-003"></a>
## CF-003 — 朱雀官方接口真实契约探测

**依赖：** CF-002。

**文件：** `schemas/zhuque.raw.schema.json`、`docs/verification/zhuque-contract.md`、`tests/fixtures/zhuque/`。

**输入：** 用户明确授权的测试文本与 credential_ref。

**输出：** 经脱敏原始响应；整体/分段样例；实际索引与长度观测。

**验收：** 中文、Emoji、换行、空文本、鉴权错误；记录用量字段与未知字段；未知上限不编造。

**约束：** 网络实际探测与录制 fixture；禁止以 mock 报告替代实测。

**反例：** 空文本、中文 Emoji 和业务失败 HTTP 200；保存原始结果，不将失败写为 pass。

**验证命令：** `npm run test -- tests/contract/zhuque-probe.test.ts`。

**证据：** `docs/verification/tasks/CF-003.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-004"></a>
## CF-004 — 公众号草稿权限与回读链路验证

**依赖：** CF-002。

**文件：** `docs/verification/wechat-contract.md`、`schemas/wechat.raw.schema.json`、`tests/fixtures/wechat/`。

**输入：** 明确账号、上传及草稿写入授权。

**输出：** 真实草稿 ID；创建/读取/更新能力与权限矩阵。

**验收：** 草稿后台可见且回读正文一致；验证网络失败后查找路径；不得公开群发。

**约束：** 使用可识别测试文章；记录创建资产与清理建议，删除仍需单独授权。

**反例：** 测试账号没有草稿权限；阻止写入，不以编辑器填入代替远端 ID。

**验证命令：** `npm run test -- tests/contract/wechat-probe.test.ts`。

**证据：** `docs/verification/tasks/CF-004.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-005"></a>
## CF-005 — 上游排版移植与 golden 基线

**依赖：** CF-001、CF-002。

**文件：** `adapters/baoyu/README.md`、`tests/fixtures/render/`、`docs/verification/render-parity.md`。

**输入：** 锁定上游格式化/微信渲染脚本。

**输出：** Node24 可运行的裁剪方案和渲染对照样本。

**验收：** 迁移保持代码/链接/中文强调；生成标题摘要的行为被隔离；无隐式 Bun 下载。

**约束：** 记录每处 upstream 改动及许可证，不把整个上游全量加入宿主上下文。

**反例：** 上游格式化尝试补写标题/摘要；输出内容差异并拒绝当作纯格式更改。

**验证命令：** `npm run test -- tests/contract/render-parity.test.ts`。

**证据：** `docs/verification/tasks/CF-005.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-006"></a>
## CF-006 — Image Factory 协作契约验证

**依赖：** CF-002。

**文件：** `adapters/image-factory/probe.ts`、`schemas/image-factory-receipt.schema.json`、`docs/verification/image-bridge.md`。

**输入：** 现有 Image Factory 安装与已批准的测试素材。

**输出：** 实际 capability、回执字段、文件哈希与可用宿主矩阵。

**验收：** 无能力不生成；有图无有效回执不接受；费用拒绝不自动重试。

**约束：** 现有图像回执可先离线测试；新生图仅在明确预算批准后执行。

**反例：** 外部图片回执缺文件或哈希；不得注册可交付资产。

**验证命令：** `npm run test -- tests/contract/image-bridge.test.ts`。

**证据：** `docs/verification/tasks/CF-006.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-007"></a>
## CF-007 — 工作区、对象存储与 SQLite 事务

**依赖：** CF-002。

**文件：** `packages/core/src/workspace/store.ts`、`packages/core/src/workspace/migrations.ts`、`packages/core/src/workspace/objects.ts`。

**输入：** 工作区根与 schema_version。

**输出：** Workspace；objects/<sha256>；事件和引用的事务写入。

**验收：** 中途退出无已提交半文件；迁移失败可恢复；未来 schema 只读阻止写入。

**约束：** 本地数据库与不可变对象拆分；备份后迁移；跨进程锁。

**反例：** 在对象写入与数据库提交间强杀；恢复后无已提交记录指向缺失对象。

**验证命令：** `npm run test -- tests/integration/workspace.test.ts`。

**证据：** `docs/verification/tasks/CF-007.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-008"></a>
## CF-008 — TXT/Markdown 素材导入与去重

**依赖：** CF-007。

**文件：** `packages/core/src/content/import-text.ts`、`packages/core/src/content/sources.ts`、`schemas/source.schema.json`。

**输入：** UTF-8 文本、Markdown、路径与使用范围。

**输出：** SourceRecord 与内容快照；hash 去重。

**验收：** 中文路径、空文件、错误编码、重复导入、超过限制；不会默默截断正文。

**约束：** 正文和元数据分开；保留原始字节与提取表示。

**反例：** 重复导入相同 bytes 和同名不同 bytes；前者去重，后者保留新来源。

**验证命令：** `npm run test -- tests/integration/import-text.test.ts`。

**证据：** `docs/verification/tasks/CF-008.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-009"></a>
## CF-009 — 受控 URL 读取、正文提取与来源定位

**依赖：** CF-007、CF-008。

**文件：** `packages/core/src/content/fetch-source.ts`、`packages/core/src/security/url-policy.ts`。

**输入：** 授权 URL、网络策略。

**输出：** 已读取来源、时间、定位与访问状态。

**验收：** SSRF、重定向至内网、登录墙、空正文、提示词注入、超大响应被正确处理。

**约束：** 只允许批准的 HTTP(S) 公网目标；外部指令隔离为引用素材。

**反例：** 网页重定向到私网、响应超限或正文含窃密指令；阻止请求或降为不可信材料。

**验证命令：** `npm run test -- tests/integration/fetch-source.test.ts`。

**证据：** `docs/verification/tasks/CF-009.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-010"></a>
## CF-010 — DOCX 与文本 PDF 导入

**依赖：** CF-008。

**文件：** `packages/core/src/content/import-docx.ts`、`packages/core/src/content/import-pdf.ts`、`tests/fixtures/import/`。

**输入：** 20MiB 以下文档、累计解压限额。

**输出：** 按页/段定位的文本及 extraction warnings。

**验收：** 扫描件、公式/复杂表格、压缩炸弹、乱码、页数异常；低质量提取不得作为完整证据。

**约束：** 不在此任务启用 OCR；失败保留原文并输出明确修复方式。

**反例：** 扫描 PDF、加密/损坏文档或 DOCX 外部关系；显式报能力限制，不悄悄 OCR/联网。

**验证命令：** `npm run test -- tests/integration/import-documents.test.ts`。

**证据：** `docs/verification/tasks/CF-010.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-011"></a>
## CF-011 — 不可变版本、差异与并发冲突

**依赖：** CF-007、CF-008。

**文件：** `packages/core/src/content/revisions.ts`、`packages/core/src/content/diff.ts`、`packages/core/src/workspace/lease.ts`。

**输入：** base revision、候选 artifact、expected_revision。

**输出：** ContentRevision、Diff、受控 head 更新。

**验收：** 人和 Agent 从同一 base 提交时只有一个成功；旧版本不覆盖新版本；回滚不改旧对象。

**约束：** 先校验候选 hash，再事务 CAS 更新；不由模型直接改数据库。

**反例：** 人和 Agent 提交同一 expected revision；只允许一个推进 head，另一个保留 conflict。

**验证命令：** `npm run test -- tests/integration/revisions.test.ts`。

**证据：** `docs/verification/tasks/CF-011.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-012"></a>
## CF-012 — Run/Step 账本与恢复执行

**依赖：** CF-007、CF-011。

**文件：** `packages/core/src/workflow/runner.ts`、`packages/core/src/workflow/recovery.ts`、`packages/core/src/workflow/events.ts`。

**输入：** StepRequest、输入 hash、输出 artifact。

**输出：** Run、Step、单调事件；run next/submit/resume/cancel。

**验收：** 各阶段强杀后续跑只使用核验产物；租约过期与取消后迟到产物不推进 head。

**约束：** 内核只调度阶段；宿主提交候选，不能自报完成绕过校验。

**反例：** 带已记录有效回执的任务重启；外部调用计数不增加，从下一检查点恢复。

**验证命令：** `npm run test -- tests/integration/recovery.test.ts`。

**证据：** `docs/verification/tasks/CF-012.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-013"></a>
## CF-013 — 唯一 content-harness 与任务模式编排

**依赖：** CF-012。

**文件：** `skills/content-harness/SKILL.md`、`schemas/brief.schema.json`、`packages/core/src/application/dispatch.ts`。

**输入：** 用户主题、模式、已知偏好、渠道。

**输出：** ContentBrief 与阶段 DAG。

**验收：** full/edit/format/detect/repurpose 走不同路径；已有信息不重复提问；资料缺失不虚构。

**约束：** 任务简报可修改；简单任务不强迫走全部阶段。

**反例：** 用户只说排版；编排图没有研究、重写、付费检测和远程发布节点。

**验证命令：** `npm run test -- tests/contract/brief-routing.test.ts`。

**证据：** `docs/verification/tasks/CF-013.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-014"></a>
## CF-014 — 作者档案与术语保护

**依赖：** CF-011、CF-013。

**文件：** `packages/core/src/content/author-profile.ts`、`schemas/author-profile.schema.json`、`skills/content-harness/references/voice.md`。

**输入：** 可选作者样文、品牌术语、禁用表达。

**输出：** 版本化 AuthorProfile 和受保护词表。

**验收：** 无样文有默认风格；样文个人细节不进入新稿；品牌名和单位不被润色替换。

**约束：** 提取文体特征而不复述作者隐私；样文变更形成新 profile revision。

**反例：** 作者样文有私密客户名而 Brief 无该事实；新稿不得出现该名字。

**验证命令：** `npm run test -- tests/integration/author-profile.test.ts`。

**证据：** `docs/verification/tasks/CF-014.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-015"></a>
## CF-015 — 研究、SourceBundle 与 ClaimRegistry

**依赖：** CF-009、CF-010、CF-013。

**文件：** `adapters/content-methods/research.ts`、`packages/core/src/content/claims.ts`、`schemas/claim.schema.json`。

**输入：** 真实来源与可访问文本。

**输出：** 每个重要可验证主张关联 source + locator。

**验收：** 未读取来源不能引用；冲突来源并存；用户口述不能标为独立公开验证。

**约束：** 无搜索时 materials-only 状态显式；来源许可与交付摘录范围分开。

**反例：** 同一指标两个来源冲突；保留冲突证据，不自动挑有利数值。

**验证命令：** `npm run test -- tests/integration/claims.test.ts`。

**证据：** `docs/verification/tasks/CF-015.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-016"></a>
## CF-016 — 五类内容模板与 Vendor 写作适配

**依赖：** CF-014、CF-015。

**文件：** `adapters/content-methods/write.ts`、`templates/content/`、`schemas/content-output.schema.json`。

**输入：** Brief、ClaimRegistry、样文、模板。

**输出：** OutlineRevision 与 DraftRevision。

**验收：** 五类内容结构合适；用户指定大纲保留；代码/数据从证据传入；缺案例信息不能补造。

**约束：** 先大纲后正文；用户直接写稿模式可跳过大纲人工检查点。

**反例：** 客户案例没有收益数据；输出缺项，不编造提升百分比。

**验证命令：** `npm run test -- tests/e2e/writing-flow.test.ts`。

**证据：** `docs/verification/tasks/CF-016.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-017"></a>
## CF-017 — 事实保护与独立审校报告

**依赖：** CF-011、CF-015、CF-016。

**文件：** `packages/core/src/review/facts.ts`、`packages/core/src/review/reports.ts`。

**输入：** 原稿、修改稿、claim 与 source。

**输出：** 确定性差异与语义审校分开的 ReviewReport。

**验收：** 数字/百分比/单位/否定/时间范围改变触发风险；引用失效阻止已验证交付。

**约束：** 不能用 LLM 自评分代替来源；保留人工裁定和原因。

**反例：** 编辑改变命令、数字或引用目标；事实报告保留精确差异，拒绝静默接受。

**验证命令：** `npm run test -- tests/integration/fact-guards.test.ts`。

**证据：** `docs/verification/tasks/CF-017.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-018"></a>
## CF-018 — Vendor Humanizer/Copy Editing 与有限迭代

**依赖：** CF-014、CF-017。

**文件：** `adapters/content-methods/edit.ts`、`packages/core/src/review/edit-policy.ts`、`skills/content-harness/references/editing.md`。

**输入：** 稿件、强度、局部段落选择、保护项。

**输出：** EditedRevision、Diff 与变更理由。

**验收：** 不编第一人称经历；代码/日期/引用目标保持；超过两轮转人工；无文字混淆技巧。

**约束：** 标准档默认；深度重排展示事实映射；对话历史不是内容事实源。

**反例：** 已到两轮自动润色且仍不满意；回到人工审阅，不继续追逐检测分数。

**验证命令：** `npm run test -- tests/e2e/humanize.test.ts`。

**证据：** `docs/verification/tasks/CF-018.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

<a id="cf-019"></a>
## CF-019 — 一稿多用的派生版本

**依赖：** CF-016、CF-017、CF-018。

**文件：** `packages/core/src/content/repurpose.ts`、`adapters/content-methods/repurpose.ts`。

**输入：** 主文章、短内容/口播目标与渠道约束。

**输出：** 新 ContentItem、parent lineage、独立审校需求。

**验收：** 主稿不被覆盖；派生稿不得继承原检测报告；缩写不误导原始数据。

**约束：** 复用资料与 claim，重新生成检测文本；脚本可供视频工厂后续使用。

**反例：** 从主稿改编出短帖；短帖拥有新版本且主稿报告不自动覆盖。

**验证命令：** `npm run test -- tests/e2e/repurpose.test.ts`。

**证据：** `docs/verification/tasks/CF-019.json`，需原要求/失败断言、实际环境、commit/package、fixture/live 与 review 信息。

