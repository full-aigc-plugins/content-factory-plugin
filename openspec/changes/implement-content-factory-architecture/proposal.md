# 实现 Content Factory 完整架构

## Why

已确认的三部分架构呈现必须成为可阅读、可追踪的正式架构文档；现有两组任务虽然覆盖 CF-001–CF-058，但部分只有父任务说明，需要进一步明确接口、实施步骤、反例、验证命令和证据边界。

本变更固化已确认架构并拆分实施，不另建第三套产品、不扩大默认公开发布能力。本次提交只包含文档和文档检查材料，未来才按任务实现产品。

## What Changes

- 完整写入三部分正文、三张主图及一个 Recipe 示例图，不以摘要或链接替代。
- 补充上下文、状态、核心对象、StagePort、模块依赖、媒体协作、交付和恢复约束。
- 沿用 58 个父任务，拆成 232 个可勾选执行子项；明确责任文件、输入输出、依赖、正反例和证据。
- 提供执行顺序、追踪、16 渠道/39 个形式组合覆盖与结构验收。
- 保留原变更和任务文本；CF-058 仍为 CF-042 的前置发行门槛。

## Capabilities

### New Capabilities

- `architecture-implementation-traceability`: 完整架构正文和执行子项可追踪、原任务不丢失。
- `end-to-end-stage-contracts`: 各阶段在同一上下文、状态和权限边界中交付，外部方法不得绕过内核。
- `architecture-evidence-gates`: 结构、fixture、真实服务和发行证据分开判定。

### Modified Capabilities

无。前两组能力仍是未归档变更，本次不对不存在的 canonical specs 使用 MODIFIED，也不提前同步或归档。

## Impact

新增 `docs/architecture/Content-Factory-Architecture.zh_CN.md` 与本变更文档；更新导航。实现任务会涉及已有计划中的 core/ports/adapters/profiles/recipes/skills 等目标位置，但本次不创建运行时、不安装 Vendor、不写用户公众号、不发布市场版本。

## Non-goals

不删减 V1，不改成全渠道公开发布服务，不生成图片或视频，不把图表存在当作实现完成，不把外部候选直接加入锁文件。

## Dependencies

共同读取 `establish-content-factory-v1` 和 `add-platform-aware-content-orchestration`。本变更是二者的架构入口与执行细分；不是在前两组产品全部实现之后才开始的第三期项目。
