# Content Factory Architecture Implementation Tasks

> 执行人员：按 `superpowers:executing-plans` 或已选择的等价执行方式逐项实施；本文件仅拆分已存在任务，不授权额外付费调用或公开发布。

**Goal:** 实现完整架构中的三上下文、渠道策略、Vendor 编排、确定性内核与媒体/交付边界。
**Architecture:** 一个 content-harness，16 个渠道、39 个已声明渠道×形式组合的 Profile/Recipe，外部方法经准入后调用；所有候选产物回到内核接受检查。
**Tech Stack:** TypeScript、Node.js 24 LTS、SQLite、CLI/stdio MCP；具体依赖版本由 CF-001 锁定。
**Spec:** [完整架构](../../../docs/architecture/Content-Factory-Architecture.zh_CN.md)、[本次设计](design.md)、两个原变更及其验收。

## 状态与编号

58 个父任务沿用 CF-001–CF-058；每个拆成四个子项，共 232 个。当前 38 个父任务为 `COMPLETE`，20 个父任务为 `PARTIAL_OFFLINE`；状态以逐任务回执为准并由自动化一致性测试校验。本文件是执行明细，不增加第二套独立产品任务。父任务只能在其子项、原验收和所需真实证据都完成后汇总；不得仅凭子项数更新父状态。原 58 项文本保留，受影响实现职责以已确认的 Vendor/单 Harness 决策为准。

## 全局约束

保持唯一 `content-harness`；Profile/Recipe 不是新本地 Skill。禁止动态 latest 安装、泛化关闭沙箱、绕过访问控制和隐藏付费回退。来源/宿主/目标分开；每次外发/写入/媒体生成先检查授权和预算。工作稿、检测完成、审批完成、交付核验分别记状态。禁止视觉生成 Skill 进入 Content Factory。

所有后续命令为 CF-002 建立工具链后的实施入口，不是本次运行成功记录。RED 必须是正确 fixture 下的业务断言失败，不是缺依赖、缺网络或没有账号。live 需要用户授权与真实回执；无法运行写 NOT_RUN/BLOCKED，不计为通过。

## 重点回归

来源平台误当目标（CF-044）；Vendor 隐式提权（CF-049）；审批后替换（CF-032）；响应丢失后重复写入（CF-034）；媒体回执迟到绑定旧稿（CF-051）。每项已在对应任务的反例中固定。

## 公共测试契约

CF-002 建立 `tests/support/architecture-case.ts`，使用可注入的端口和临时工作区。CaseSpec 保存 given/when/then/negative；每个任务把下列具体场景翻成对其责任模块的断言，不把文本相等当作业务行为测试。正例检查输出 Schema 和持久状态，反例必须同时检查错误语义、外部调用计数及状态未被非法推进。

```typescript
// CF-002 的测试支持契约；实现时 run 会由每个责任模块的 fixture 适配器提供。
export type CaseSpec = {
  id: string; given: string; when: string; then: string; negative: string;
};
export type CaseOutcome = {
  outputSchemaValid: boolean; invariantChecks: Record<string, boolean>;
  externalCalls: number; unauthorizedWrites: number;
};
export type CaseRunner = (spec: CaseSpec) => Promise<CaseOutcome>;
```

每个第四子项均要求 `docs/verification/tasks/CF-NNN.json` 包含 commit/package hash、宿主/系统/版本、执行命令、退出码、断言、fixture/live 分类、授权引用和原始证据；记录不能包含凭据。完成一项独立提交，示例命令中的文件使用下面列出的精确责任路径，不执行 `git add -A`。

## 使用方法

每父任务链接到对应详细任务卡，卡中完整列出责任文件、输入输出、原验收约束、具体反例、目标命令与证据位置。下面的四个子项是该卡的执行状态，不是四个重复的产品功能。阶段依赖是实现依赖，不表示每次文章任务必须跑全链路。

## 1. CF-001 — 不可变 Vendor 供应链与发行结构

[详细任务卡](task-details/foundation.md#cf-001)

- [x] 1.1 [CF-001.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 1.2 [CF-001.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 1.3 [CF-001.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 1.4 [CF-001.4] 原要求与证据复核、独立 review/commit。

## 2. CF-002 — CLI/MCP 引导与宿主能力探测

[详细任务卡](task-details/foundation.md#cf-002)

- [x] 2.1 [CF-002.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 2.2 [CF-002.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 2.3 [CF-002.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 2.4 [CF-002.4] 原要求与证据复核、独立 review/commit。

## 3. CF-003 — AI 内容检测平台真实契约探测

[详细任务卡](task-details/foundation.md#cf-003)

- [ ] 3.1 [CF-003.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 3.2 [CF-003.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 3.3 [CF-003.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 3.4 [CF-003.4] 原要求与证据复核、独立 review/commit。

## 4. CF-004 — 公众号草稿权限与回读链路验证

[详细任务卡](task-details/foundation.md#cf-004)

- [ ] 4.1 [CF-004.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 4.2 [CF-004.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 4.3 [CF-004.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 4.4 [CF-004.4] 原要求与证据复核、独立 review/commit。

## 5. CF-005 — 上游排版移植与 golden 基线

[详细任务卡](task-details/foundation.md#cf-005)

> 当前状态：`COMPLETE`。`v1.63.0` Baoyu 格式化 Skill 已锁定并 vendored；RED run 35521706055 暴露真实目录摘要漂移，GREEN run 35523357715 的 lint/typecheck/test/skills:check/build 全部通过。

- [x] 5.1 [CF-005.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 5.2 [CF-005.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 5.3 [CF-005.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 5.4 [CF-005.4] 原要求与证据复核、独立 review/commit。

## 6. CF-006 — Image Factory 协作契约验证

[详细任务卡](task-details/foundation.md#cf-006)

- [x] 6.1 [CF-006.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 6.2 [CF-006.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 6.3 [CF-006.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 6.4 [CF-006.4] 原要求与证据复核、独立 review/commit。

## 7. CF-007 — 工作区、对象存储与 SQLite 事务

[详细任务卡](task-details/foundation.md#cf-007)

- [x] 7.1 [CF-007.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 7.2 [CF-007.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 7.3 [CF-007.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 7.4 [CF-007.4] 原要求与证据复核、独立 review/commit。

## 8. CF-008 — TXT/Markdown 素材导入与去重

[详细任务卡](task-details/foundation.md#cf-008)

- [x] 8.1 [CF-008.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 8.2 [CF-008.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 8.3 [CF-008.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 8.4 [CF-008.4] 原要求与证据复核、独立 review/commit。

## 9. CF-009 — 受控 URL 读取、正文提取与来源定位

[详细任务卡](task-details/foundation.md#cf-009)

- [x] 9.1 [CF-009.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 9.2 [CF-009.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 9.3 [CF-009.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 9.4 [CF-009.4] 原要求与证据复核、独立 review/commit。

## 10. CF-010 — DOCX 与文本 PDF 导入

[详细任务卡](task-details/foundation.md#cf-010)

- [x] 10.1 [CF-010.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 10.2 [CF-010.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 10.3 [CF-010.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 10.4 [CF-010.4] 原要求与证据复核、独立 review/commit。

## 11. CF-011 — 不可变版本、差异与并发冲突

[详细任务卡](task-details/foundation.md#cf-011)

- [x] 11.1 [CF-011.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 11.2 [CF-011.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 11.3 [CF-011.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 11.4 [CF-011.4] 原要求与证据复核、独立 review/commit。

## 12. CF-012 — Run/Step 账本与恢复执行

[详细任务卡](task-details/foundation.md#cf-012)

- [x] 12.1 [CF-012.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 12.2 [CF-012.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 12.3 [CF-012.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 12.4 [CF-012.4] 原要求与证据复核、独立 review/commit。

## 13. CF-013 — 唯一 content-harness 与任务模式编排

[详细任务卡](task-details/foundation.md#cf-013)

- [x] 13.1 [CF-013.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 13.2 [CF-013.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 13.3 [CF-013.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 13.4 [CF-013.4] 原要求与证据复核、独立 review/commit。

## 14. CF-014 — 作者档案与术语保护

[详细任务卡](task-details/foundation.md#cf-014)

- [x] 14.1 [CF-014.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 14.2 [CF-014.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 14.3 [CF-014.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 14.4 [CF-014.4] 原要求与证据复核、独立 review/commit。

## 15. CF-015 — 研究、SourceBundle 与 ClaimRegistry

[详细任务卡](task-details/foundation.md#cf-015)

- [x] 15.1 [CF-015.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 15.2 [CF-015.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 15.3 [CF-015.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 15.4 [CF-015.4] 原要求与证据复核、独立 review/commit。

## 16. CF-016 — 五类内容模板与 Vendor 写作适配

[详细任务卡](task-details/foundation.md#cf-016)

- [x] 16.1 [CF-016.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 16.2 [CF-016.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 16.3 [CF-016.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 16.4 [CF-016.4] 原要求与证据复核、独立 review/commit。

## 17. CF-017 — 事实保护与独立审校报告

[详细任务卡](task-details/foundation.md#cf-017)

- [x] 17.1 [CF-017.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 17.2 [CF-017.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 17.3 [CF-017.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 17.4 [CF-017.4] 原要求与证据复核、独立 review/commit。

## 18. CF-018 — Vendor Humanizer/Copy Editing 与有限迭代

[详细任务卡](task-details/foundation.md#cf-018)

- [x] 18.1 [CF-018.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 18.2 [CF-018.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 18.3 [CF-018.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 18.4 [CF-018.4] 原要求与证据复核、独立 review/commit。

## 19. CF-019 — 一稿多用的派生版本

[详细任务卡](task-details/foundation.md#cf-019)

- [x] 19.1 [CF-019.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 19.2 [CF-019.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 19.3 [CF-019.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 19.4 [CF-019.4] 原要求与证据复核、独立 review/commit。

## 20. CF-020 — 配图计划、现有图片导入与资产权属

[详细任务卡](task-details/production-delivery.md#cf-020)

- [x] 20.1 [CF-020.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 20.2 [CF-020.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 20.3 [CF-020.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 20.4 [CF-020.4] 原要求与证据复核、独立 review/commit。

## 21. CF-021 — 图片工厂受控调用与回执接收

[详细任务卡](task-details/production-delivery.md#cf-021)

- [x] 21.1 [CF-021.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 21.2 [CF-021.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 21.3 [CF-021.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 21.4 [CF-021.4] 原要求与证据复核、独立 review/commit。

## 22. CF-022 — 确定性 Markdown/HTML 渲染与文字冻结

[详细任务卡](task-details/production-delivery.md#cf-022)

- [x] 22.1 [CF-022.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 22.2 [CF-022.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 22.3 [CF-022.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 22.4 [CF-022.4] 原要求与证据复核、独立 review/commit。

## 23. CF-023 — 三套主题与手机排版回归

[详细任务卡](task-details/production-delivery.md#cf-023)

- [x] 23.1 [CF-023.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 23.2 [CF-023.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 23.3 [CF-023.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 23.4 [CF-023.4] 原要求与证据复核、独立 review/commit。

## 24. CF-024 — 本地审阅报告与修订比较

[详细任务卡](task-details/production-delivery.md#cf-024)

- [x] 24.1 [CF-024.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 24.2 [CF-024.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 24.3 [CF-024.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 24.4 [CF-024.4] 原要求与证据复核、独立 review/commit。

## 25. CF-025 — AI 内容检测平台 HTTP 适配与原始证据存储

[详细任务卡](task-details/production-delivery.md#cf-025)

- [ ] 25.1 [CF-025.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 25.2 [CF-025.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 25.3 [CF-025.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 25.4 [CF-025.4] 原要求与证据复核、独立 review/commit。

## 26. CF-026 — 分类比例解释与 Unicode 分段定位

[详细任务卡](task-details/production-delivery.md#cf-026)

- [ ] 26.1 [CF-026.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 26.2 [CF-026.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 26.3 [CF-026.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 26.4 [CF-026.4] 原要求与证据复核、独立 review/commit。

## 27. CF-027 — 检测政策、人工例外与交付门槛

[详细任务卡](task-details/production-delivery.md#cf-027)

- [ ] 27.1 [CF-027.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 27.2 [CF-027.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 27.3 [CF-027.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 27.4 [CF-027.4] 原要求与证据复核、独立 review/commit。

## 28. CF-028 — 报告失效、请求去重与时效政策

[详细任务卡](task-details/production-delivery.md#cf-028)

- [ ] 28.1 [CF-028.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 28.2 [CF-028.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 28.3 [CF-028.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 28.4 [CF-028.4] 原要求与证据复核、独立 review/commit。

## 29. CF-029 — 费用、额度、重试与取消

[详细任务卡](task-details/production-delivery.md#cf-029)

- [ ] 29.1 [CF-029.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 29.2 [CF-029.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 29.3 [CF-029.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 29.4 [CF-029.4] 原要求与证据复核、独立 review/commit。

## 30. CF-030 — 完整检测报告与真实对照样本

[详细任务卡](task-details/production-delivery.md#cf-030)

- [ ] 30.1 [CF-030.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 30.2 [CF-030.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 30.3 [CF-030.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 30.4 [CF-030.4] 原要求与证据复核、独立 review/commit。

## 31. CF-031 — 账号、凭据与交付权限预检

[详细任务卡](task-details/production-delivery.md#cf-031)

- [ ] 31.1 [CF-031.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 31.2 [CF-031.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 31.3 [CF-031.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 31.4 [CF-031.4] 原要求与证据复核、独立 review/commit。

## 32. CF-032 — 冻结交付包与受控审批记录

[详细任务卡](task-details/production-delivery.md#cf-032)

- [ ] 32.1 [CF-032.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 32.2 [CF-032.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 32.3 [CF-032.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 32.4 [CF-032.4] 原要求与证据复核、独立 review/commit。

## 33. CF-033 — Baoyu 微信渠道适配与持久提交意图

[详细任务卡](task-details/production-delivery.md#cf-033)

- [ ] 33.1 [CF-033.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 33.2 [CF-033.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 33.3 [CF-033.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 33.4 [CF-033.4] 原要求与证据复核、独立 review/commit。

## 34. CF-034 — 草稿回读、冲突与更新

[详细任务卡](task-details/production-delivery.md#cf-034)

- [ ] 34.1 [CF-034.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 34.2 [CF-034.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 34.3 [CF-034.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 34.4 [CF-034.4] 原要求与证据复核、独立 review/commit。

## 35. CF-035 — 受控浏览器草稿路径

[详细任务卡](task-details/production-delivery.md#cf-035)

- [ ] 35.1 [CF-035.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 35.2 [CF-035.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 35.3 [CF-035.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 35.4 [CF-035.4] 原要求与证据复核、独立 review/commit。

## 36. CF-036 — 工作稿/已验证交付包导出

[详细任务卡](task-details/production-delivery.md#cf-036)

- [ ] 36.1 [CF-036.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 36.2 [CF-036.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 36.3 [CF-036.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 36.4 [CF-036.4] 原要求与证据复核、独立 review/commit。

## 37. CF-037 — 安全与供应链专项验证

[详细任务卡](task-details/production-delivery.md#cf-037)

- [x] 37.1 [CF-037.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 37.2 [CF-037.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 37.3 [CF-037.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 37.4 [CF-037.4] 原要求与证据复核、独立 review/commit。

## 38. CF-038 — 崩溃、重复提交与依赖故障回归

[详细任务卡](task-details/production-delivery.md#cf-038)

- [x] 38.1 [CF-038.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 38.2 [CF-038.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 38.3 [CF-038.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 38.4 [CF-038.4] 原要求与证据复核、独立 review/commit。

## 39. CF-039 — 30篇内容评测与编辑质量回归

[详细任务卡](task-details/production-delivery.md#cf-039)

- [ ] 39.1 [CF-039.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 39.2 [CF-039.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 39.3 [CF-039.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 39.4 [CF-039.4] 原要求与证据复核、独立 review/commit。

## 40. CF-040 — 三操作系统安装与资源迁移

[详细任务卡](task-details/production-delivery.md#cf-040)

- [x] 40.1 [CF-040.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 40.2 [CF-040.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 40.3 [CF-040.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 40.4 [CF-040.4] 原要求与证据复核、独立 review/commit。

## 41. CF-041 — 三宿主实装与真实端到端验收

[详细任务卡](task-details/production-delivery.md#cf-041)

- [ ] 41.1 [CF-041.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 41.2 [CF-041.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 41.3 [CF-041.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 41.4 [CF-041.4] 原要求与证据复核、独立 review/commit。

## 42. CF-042 — 发行包、市场登记、文档与最终门禁

[详细任务卡](task-details/production-delivery.md#cf-042)

- [ ] 42.1 [CF-042.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 42.2 [CF-042.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 42.3 [CF-042.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 42.4 [CF-042.4] 原要求与证据复核、独立 review/commit。

## 43. CF-043 — Candidate provenance and intake snapshots

[详细任务卡](task-details/platforms.md#cf-043)

- [x] 43.1 [CF-043.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 43.2 [CF-043.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 43.3 [CF-043.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 43.4 [CF-043.4] 原要求与证据复核、独立 review/commit。

## 44. CF-044 — Separate host/source/channel context and resolve ambiguity

[详细任务卡](task-details/platforms.md#cf-044)

- [x] 44.1 [CF-044.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 44.2 [CF-044.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 44.3 [CF-044.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 44.4 [CF-044.4] 原要求与证据复核、独立 review/commit。

## 45. CF-045 — Versioned profiles and per-format recipe registry

[详细任务卡](task-details/platforms.md#cf-045)

- [x] 45.1 [CF-045.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 45.2 [CF-045.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 45.3 [CF-045.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 45.4 [CF-045.4] 原要求与证据复核、独立 review/commit。

## 46. CF-046 — Single-harness platform-aware routing

[详细任务卡](task-details/platforms.md#cf-046)

- [x] 46.1 [CF-046.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 46.2 [CF-046.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 46.3 [CF-046.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 46.4 [CF-046.4] 原要求与证据复核、独立 review/commit。

## 47. CF-047 — Shared vendor integration and semantic adaptation

[详细任务卡](task-details/platforms.md#cf-047)

- [x] 47.1 [CF-047.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 47.2 [CF-047.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 47.3 [CF-047.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 47.4 [CF-047.4] 原要求与证据复核、独立 review/commit。

## 48. CF-048 — Channel-specialized candidate conformance

[详细任务卡](task-details/platforms.md#cf-048)

- [x] 48.1 [CF-048.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 48.2 [CF-048.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 48.3 [CF-048.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 48.4 [CF-048.4] 原要求与证据复核、独立 review/commit。

## 49. CF-049 — Runtime eligibility, progressive loading and fallback

[详细任务卡](task-details/platforms.md#cf-049)

- [x] 49.1 [CF-049.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 49.2 [CF-049.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 49.3 [CF-049.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 49.4 [CF-049.4] 原要求与证据复核、独立 review/commit。

## 50. CF-050 — Channel-native source-grounded writing and editing

[详细任务卡](task-details/platforms.md#cf-050)

- [x] 50.1 [CF-050.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 50.2 [CF-050.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 50.3 [CF-050.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 50.4 [CF-050.4] 原要求与证据复核、独立 review/commit。

## 51. CF-051 — Channel-format media briefs and external receipts

[详细任务卡](task-details/platforms.md#cf-051)

- [x] 51.1 [CF-051.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 51.2 [CF-051.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 51.3 [CF-051.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 51.4 [CF-051.4] 原要求与证据复核、独立 review/commit。

## 52. CF-052 — Sibling variants and dependent evidence invalidation

[详细任务卡](task-details/platforms.md#cf-052)

- [x] 52.1 [CF-052.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 52.2 [CF-052.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 52.3 [CF-052.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 52.4 [CF-052.4] 原要求与证据复核、独立 review/commit。

## 53. CF-053 — Per-action channel delivery capabilities

[详细任务卡](task-details/platforms.md#cf-053)

- [ ] 53.1 [CF-053.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 53.2 [CF-053.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 53.3 [CF-053.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 53.4 [CF-053.4] 原要求与证据复核、独立 review/commit。

## 54. CF-054 — Metrics and comment-draft feedback

[详细任务卡](task-details/platforms.md#cf-054)

- [x] 54.1 [CF-054.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 54.2 [CF-054.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 54.3 [CF-054.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 54.4 [CF-054.4] 原要求与证据复核、独立 review/commit。

## 55. CF-055 — Sourced platform constraints and detector applicability

[详细任务卡](task-details/platforms.md#cf-055)

- [x] 55.1 [CF-055.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 55.2 [CF-055.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 55.3 [CF-055.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 55.4 [CF-055.4] 原要求与证据复核、独立 review/commit。

## 56. CF-056 — Routing corpus, adversarial inputs and native quality

[详细任务卡](task-details/platforms.md#cf-056)

- [ ] 56.1 [CF-056.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 56.2 [CF-056.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 56.3 [CF-056.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 56.4 [CF-056.4] 原要求与证据复核、独立 review/commit。

## 57. CF-057 — Actual host/channel/account verification

[详细任务卡](task-details/platforms.md#cf-057)

- [ ] 57.1 [CF-057.1] 正反例 fixture 与精确断言，确认业务 RED。
- [ ] 57.2 [CF-057.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [ ] 57.3 [CF-057.3] 目标测试、typecheck、lint、直接依赖回归。
- [ ] 57.4 [CF-057.4] 原要求与证据复核、独立 review/commit。

## 58. CF-058 — Integrated V1 release evidence gate

[详细任务卡](task-details/platforms.md#cf-058)

- [x] 58.1 [CF-058.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 58.2 [CF-058.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 58.3 [CF-058.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 58.4 [CF-058.4] 原要求与证据复核、独立 review/commit。
