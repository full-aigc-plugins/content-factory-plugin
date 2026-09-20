# 架构固化与实施拆分设计

## 1. 唯一完整架构入口

[Content-Factory-Architecture.zh_CN.md](../../../docs/architecture/Content-Factory-Architecture.zh_CN.md)包含用户确认的三部分全文和四个 text 块；不只提供一张简图。`PRESENTATION-BEGIN/END` 内正文与捕获原件进行 byte-for-byte 比较；会话引用标记转换为仓库来源说明，技术含义不改写。

正文之后补充工程模块、核心字段与 StagePort、16 渠道/39 个形式、权限、故障恢复、部署生命周期和来源更新规则。新增工程说明不是已发布 API 声明。

## 2. 拆分边界

父任务保留 CF-001–CF-058；每个四子项：`.1` 精确业务 RED、`.2` 最小行为 GREEN、`.3` 回归、`.4` 原要求/证据复核与提交。以原验收为上限约束，不把四个步骤都勾上就当业务已完成。

所有父任务及依赖在 task-index.json 中；tasks.md 是供人执行的正文；原两组任务仍为需求与验收来源。父任务状态通过经审核的子项与证据汇总，文档整理不修改它们。

## 3. 接口与适配

CLI 和 MCP 调用同一应用服务。Vendor Skill 返回候选 Artifact，核心服务持有版本、事实、审批、预算和回执。Context/Profile/Recipe/Binding 决定阶段图，Runtime Kernel 在执行前和接受结果前均验证。

StageRequest 固定 run/step/routing/input 引用，并携带必要权限和预算引用；StageResult 明确 status/artifacts/evidence/retry。unknown 的远程写入只能 reconcile_first，不走通用自动重试。纯域方法不伪装成网络适配器。

Profile 和 Recipe 都是数据；只保留一个 content-harness。原计划中的 content-write/content-format 等职责由已审查 Vendor 或内核承担，禁止重新建立这些本地 Skill。

## 4. 显式迁移与路径规则

本次没有移动、删除或改写旧方案。历史中 `upstream.lock.json` 的泛化技能锁职责由当前 `skills.lock.json` 承担；依赖的许可证和完整性要求不减少。媒体上传不是生成图片；内容工厂允许资产导入/绑定/上传，但生成图片只通过 Image Factory。

所有 packages/adapters/tests 路径是待实现位置。实施前在新 HEAD 再读 AGENTS，已有等价模块时做显式路径映射，不覆盖用户新增代码。技术文档的模块表须与实际任务责任目录一致。

## 5. 发布图无环

CF-057 → CF-058 → CF-042。CF-058 不依赖 CF-042；以当前候选包验证新增整合门槛后才做最终发行与市场同步。16 渠道的创作覆盖不等于 16 渠道已支持实时发布；微信公众号草稿仍为 V1 真实交付重点。

## 6. 兼容与回滚

原需求编号、R01–R42 和基础门槛均保留。本次提交可用普通 revert 撤回新增文档与导航，不涉及数据库和用户资产。未来实现改动须按迁移/备份与回执规则恢复，不能使用文档回滚来声称远端草稿已撤回。

## 7. 验证边界

检查原文保真、58/232 编号覆盖、无环依赖、39 形式覆盖、Requirement/Scenario 结构与链接。官方 CLI 可用时运行严格校验并记录版本；缺环境明确 NOT_RUN。任何检查都不能代替真实宿主、真实检测、真实草稿与人工内容评测。

## 8. 实施接口补充

CF-001 在供应链校验交付内建立最小 `package.json` 和测试入口；CF-002 扩展 CLI/MCP、宿主探测与公共 CaseRunner，不反向阻塞 CF-001。任务卡 CF-012 的历史 `StepRequest` 指向架构第六节的规范 `StageRequest`，新实现只导出后者，迁移别名必须显式声明。

文档结构校验脚本可在此提交执行；任务卡中的 `npm run test` 是未来产品实现验证，脚本存在与否不充当业务 RED。
