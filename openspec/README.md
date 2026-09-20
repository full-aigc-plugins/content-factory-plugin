# Content Factory OpenSpec / 内容工厂规范入口

Status: design and implementation planning. No runtime, vendor installation, or multi-platform publishing completion is implied.

## Read in order / 阅读顺序

1. [V1 baseline](changes/establish-content-factory-v1/proposal.md): vendor skills + one local harness + deterministic kernel + Image Factory boundary; CF-001–CF-042.
2. [Platform-aware completion](changes/add-platform-aware-content-orchestration/proposal.md): distinguish host from content channel and select channel recipes before writing.
3. [Design](changes/add-platform-aware-content-orchestration/design.md), [channel profiles](changes/add-platform-aware-content-orchestration/references/channel-profiles.md), [skill integration catalog](changes/add-platform-aware-content-orchestration/references/skill-integration-catalog.md).
4. [Evidence and research limits](changes/add-platform-aware-content-orchestration/research.md), [plan](changes/add-platform-aware-content-orchestration/plan.md), [tasks](changes/add-platform-aware-content-orchestration/tasks.md), [acceptance](changes/add-platform-aware-content-orchestration/acceptance.md).

The second change supplements the first; it does not delete the first change's requirements. There are 16 named content-channel profiles, three non-channel legacy categories, and an explicit generic-export fallback. A profile is a content strategy, not proof of an installed publisher.

第二个变更补全平台识别、渠道策略、技能准入和运行路由。旧任务编号不变，新增 CF-043–CF-058。目录发现、技能审查、安装集成、真实渠道验收分别记录，不将文档完成称为插件可用。

## OpenSpec lifecycle

New capability deltas use `## ADDED Requirements` under the new change. The original baseline remains an unarchived design source. Implement and accept the baseline first, then synchronize/archive the channel completion when its requirements pass. Do not use MODIFIED against a nonexistent canonical capability.

The previous baseline's `## Requirements` headings may require a format-only migration before official CLI validation. Preserve its requirement wording during that migration. No current document check certifies that the original baseline passes the official CLI.

## 完整架构与执行细分

[完整架构](../docs/architecture/Content-Factory-Architecture.zh_CN.md)保留三部分正文、三张主图与一个 Recipe 示例图，并补充模块、字段、状态和恢复契约。

[implement-content-factory-architecture](changes/implement-content-factory-architecture/proposal.md)是原两组变更的执行细分，不是等待它们完成后才开始的第三期项目。[任务](changes/implement-content-factory-architecture/tasks.md)沿用 CF-001–CF-058，包含 232 个子项；[计划](changes/implement-content-factory-architecture/plan.md)、[追踪](changes/implement-content-factory-architecture/traceability.md)和[验收](changes/implement-content-factory-architecture/acceptance.md)共同约束实现。

文档核验：`python3 docs/architecture/verify-architecture.py`。新变更的规范使用 ADDED Requirements；未实现前不归档或宣称产品可用。
