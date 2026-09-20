# Content Factory Architecture Implementation Plan

**Goal:** 将完整架构按既有 58 个父任务实现为首版可用插件。
**Architecture:** 单 Harness、版本化渠道配置、不可变 Vendor、权责明确的 Runtime Kernel，以及外部媒体和渠道端口。
**Tech Stack:** TypeScript + Node.js 24 LTS + SQLite + CLI/stdio MCP。
**Spec:** [完整架构](../../../docs/architecture/Content-Factory-Architecture.zh_CN.md)、[任务明细](tasks.md)、[验收](acceptance.md)。

## 1. 当前交付与产品实现分开

当前交付：架构文档、行为规格、任务拆分、追踪和文档检查。产品实现：232 个子项全部 NOT_STARTED；没有凭据不执行付费或远程写入测试，不以环境错误作为业务 RED。

## 2. 依赖驱动实施波次

| 波次 | 父任务 | 本波交付 | 开始/停止条件 |
|---|---|---|---|
| P0 工具链、准入与探测 | CF-001–006、CF-043、CF-044 | 锁定机制、共享入口、外部契约与三上下文 | 来源许可或目标未知时停止相关路径，不编造锁/权限 |
| P1 状态、来源和路由基架 | CF-007–015、CF-045、CF-046 | 不可变工作区、Source/Claim、单 Harness、Profile/Recipe | CAS/状态归属和图校验通过后再承接副作用 |
| P2 内容与有效技能 | CF-016–019、CF-047–050 | 五类源稿、按渠道原生创作、编辑保护、有效绑定 | Vendor 漂移或输出不合约不得晋升正文 |
| P3 媒体、排版和检测 | CF-020–030、CF-051、CF-055 | 媒体需求/回执、可见文字冻结、检测报告 | 依赖缺失只允许明示未完成的工作稿 |
| P4 审批、交付与复盘 | CF-031–036、CF-052–054 | 独立渠道稿、审批、草稿回读、导出、反馈建议 | 未授权、unknown 未对账、正文变更使审批失效 |
| P5 故障、安全和内容质量 | CF-037–040、CF-056 | 安全回归、30 篇基准、R01–R42、全部形式、安装 | 任一所需验收失败，不进入完整支持声明 |
| P6 真实宿主与发行 | CF-041、CF-057、CF-058、CF-042 | 精确支持矩阵、同版本证据、正式包 | CF-058 在 CF-042 前；无证据不发布 |

波次是工作组织，不覆盖 task-index.json 的精确依赖。跨波次依赖必须满足，例如 CF-047 的 Vendor 集成需要 CF-018 的编辑保护。CI/文档可准备，但不能预先发布未实现插件。

## 3. 并行边界

允许并行准备不同服务的 fixtures、研究不同候选、评审独立渠道 Recipe；同一数据库迁移、锁文件、Profile head 或公众号提交状态不并行写。所有分支按同一 StagePort/Schema 合约交接，发生接口改动先改规格和依赖任务测试。

## 4. 每任务执行方式

读取架构章节和原任务→建立输入与失败 fixture→断言业务 RED→只实现责任模块→同一断言 GREEN→回归→保存 evidence→独立 review/commit。正文自然度、事实支持与真实账号动作各自记录，不压成单一通过标记。

父任务同名不代表重复实施；本变更子项是其可执行分解。基线父任务的完整验收还要通过，才更新父状态。未知项写 UNKNOWN/NOT_RUN，不写自动通过。

## 5. 证据最小结构

```json
{
  "task_id": "CF-044",
  "evidence_kind": "fixture",
  "status": "NOT_RUN",
  "commit": null,
  "package_hash": null,
  "host": null,
  "commands": [],
  "assertions": [],
  "artifact_refs": [],
  "review": null
}
```

这是结构示例，不是本次完成回执。正式执行时填真实值、退出码、运行环境和授权引用；不能填写令牌、Cookie 或私人正文。live 验证必须记录实际供应商/账号、请求与回读证据以及包版本。
