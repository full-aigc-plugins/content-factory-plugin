# Content Factory Architecture Implementation Tasks

> 2026-10-12 过度设计裁剪：删除平台机制范围（CF-011 不可变版本差异与并发冲突、CF-012 Run/Step 账本与恢复执行、CF-027 检测政策与交付门槛、CF-028 报告去重与时效政策、CF-029 费用额度与取消、CF-032 冻结交付包与受控审批、CF-037 安全与供应链专项验证、CF-038 幂等恢复回归、CF-040 三系统安装矩阵、CF-041 三宿主实装验收、CF-042 发行包与市场门禁、CF-043 产物血缘快照、CF-049 运行时准入与回退、CF-052 证据失效联动、CF-055 检测政策适用性、CF-057 宿主渠道真实验证矩阵、CF-058 发布证据门禁）及状态/约束/测试契约等流水账段落与详细任务卡链接；历史见 git 与 docs/evidence/。保留领域功能：素材导入与去重（CF-008/009/010）、研究与 SourceBundle（CF-015）、作者档案与模板写作编辑（CF-013/014/016/017/018/050）、一稿多用与配图（CF-006/019/020/021/051）、渲染排版（CF-005/022/023）、审阅与检测报告（CF-003/024/025/026/030/039）、渠道上下文/Profile/路由（CF-044/045/046/047/048）、公众号草稿发布与导出（CF-004/031/033/034/035/036/053）、发布后反馈与质量回归（CF-054/056）及基础分发（CF-001/002/007）。未完成任务收敛为实现导向单行，证据复核子项删除。

> 执行人员：按 `superpowers:executing-plans` 或已选择的等价执行方式逐项实施；本文件仅拆分已存在任务，不授权额外付费调用或公开发布。

## 1. CF-001 — 不可变 Vendor 供应链与发行结构

- [x] 1.1 [CF-001.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 1.2 [CF-001.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 1.3 [CF-001.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 1.4 [CF-001.4] 原要求与证据复核、独立 review/commit。

## 2. CF-002 — CLI/MCP 引导与宿主能力探测

- [x] 2.1 [CF-002.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 2.2 [CF-002.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 2.3 [CF-002.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 2.4 [CF-002.4] 原要求与证据复核、独立 review/commit。

## 3. CF-003 — AI 内容检测平台真实契约探测

- [x] 3.1 [CF-003.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 3.2 [CF-003.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 3.3 [CF-003.3] 目标测试、typecheck、lint、直接依赖回归。

## 4. CF-004 — 公众号草稿权限与回读链路验证

- [ ] 4.2 [CF-004] 实现公众号草稿权限与回读链路验证（wechat.raw.schema、草稿 probe fixture、真实草稿 ID 回读一致），含回归测试。

## 5. CF-005 — 上游排版移植与 golden 基线

> 当前状态：`COMPLETE`。`v1.63.0` Baoyu 格式化 Skill 已锁定并 vendored；RED run 35521706055 暴露真实目录摘要漂移，GREEN run 35523357715 的 lint/typecheck/test/skills:check/build 全部通过。

- [x] 5.1 [CF-005.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 5.2 [CF-005.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 5.3 [CF-005.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 5.4 [CF-005.4] 原要求与证据复核、独立 review/commit。

## 6. CF-006 — Image Factory 协作契约验证

- [x] 6.1 [CF-006.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 6.2 [CF-006.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 6.3 [CF-006.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 6.4 [CF-006.4] 原要求与证据复核、独立 review/commit。

## 7. CF-007 — 工作区、对象存储与 SQLite 事务

- [x] 7.1 [CF-007.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 7.2 [CF-007.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 7.3 [CF-007.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 7.4 [CF-007.4] 原要求与证据复核、独立 review/commit。

## 8. CF-008 — TXT/Markdown 素材导入与去重

- [x] 8.1 [CF-008.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 8.2 [CF-008.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 8.3 [CF-008.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 8.4 [CF-008.4] 原要求与证据复核、独立 review/commit。

## 9. CF-009 — 受控 URL 读取、正文提取与来源定位

- [x] 9.1 [CF-009.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 9.2 [CF-009.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 9.3 [CF-009.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 9.4 [CF-009.4] 原要求与证据复核、独立 review/commit。

## 10. CF-010 — DOCX 与文本 PDF 导入

- [x] 10.1 [CF-010.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 10.2 [CF-010.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 10.3 [CF-010.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 10.4 [CF-010.4] 原要求与证据复核、独立 review/commit。

## 13. CF-013 — 唯一 content-harness 与任务模式编排

- [x] 13.1 [CF-013.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 13.2 [CF-013.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 13.3 [CF-013.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 13.4 [CF-013.4] 原要求与证据复核、独立 review/commit。

## 14. CF-014 — 作者档案与术语保护

- [x] 14.1 [CF-014.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 14.2 [CF-014.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 14.3 [CF-014.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 14.4 [CF-014.4] 原要求与证据复核、独立 review/commit。

## 15. CF-015 — 研究、SourceBundle 与 ClaimRegistry

- [x] 15.1 [CF-015.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 15.2 [CF-015.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 15.3 [CF-015.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 15.4 [CF-015.4] 原要求与证据复核、独立 review/commit。

## 16. CF-016 — 五类内容模板与 Vendor 写作适配

- [x] 16.1 [CF-016.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 16.2 [CF-016.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 16.3 [CF-016.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 16.4 [CF-016.4] 原要求与证据复核、独立 review/commit。

## 17. CF-017 — 事实保护与独立审校报告

- [x] 17.1 [CF-017.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 17.2 [CF-017.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 17.3 [CF-017.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 17.4 [CF-017.4] 原要求与证据复核、独立 review/commit。

## 18. CF-018 — Vendor Humanizer/Copy Editing 与有限迭代

- [x] 18.1 [CF-018.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 18.2 [CF-018.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 18.3 [CF-018.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 18.4 [CF-018.4] 原要求与证据复核、独立 review/commit。

## 19. CF-019 — 一稿多用的派生版本

- [x] 19.1 [CF-019.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 19.2 [CF-019.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 19.3 [CF-019.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 19.4 [CF-019.4] 原要求与证据复核、独立 review/commit。

## 20. CF-020 — 配图计划、现有图片导入与资产权属

- [x] 20.1 [CF-020.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 20.2 [CF-020.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 20.3 [CF-020.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 20.4 [CF-020.4] 原要求与证据复核、独立 review/commit。

## 21. CF-021 — 图片工厂受控调用与回执接收

- [x] 21.1 [CF-021.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 21.2 [CF-021.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 21.3 [CF-021.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 21.4 [CF-021.4] 原要求与证据复核、独立 review/commit。

## 22. CF-022 — 确定性 Markdown/HTML 渲染与文字冻结

- [x] 22.1 [CF-022.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 22.2 [CF-022.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 22.3 [CF-022.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 22.4 [CF-022.4] 原要求与证据复核、独立 review/commit。

## 23. CF-023 — 三套主题与手机排版回归

- [x] 23.1 [CF-023.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 23.2 [CF-023.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 23.3 [CF-023.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 23.4 [CF-023.4] 原要求与证据复核、独立 review/commit。

## 24. CF-024 — 本地审阅报告与修订比较

- [x] 24.1 [CF-024.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 24.2 [CF-024.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 24.3 [CF-024.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 24.4 [CF-024.4] 原要求与证据复核、独立 review/commit。

## 25. CF-025 — AI 内容检测平台 HTTP 适配与原始证据存储

- [x] 25.1 [CF-025.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 25.2 [CF-025.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 25.3 [CF-025.3] 目标测试、typecheck、lint、直接依赖回归。

## 26. CF-026 — 分类比例解释与 Unicode 分段定位

- [x] 26.1 [CF-026.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 26.2 [CF-026.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 26.3 [CF-026.3] 目标测试、typecheck、lint、直接依赖回归。

## 30. CF-030 — 完整检测报告与真实对照样本

- [x] 30.1 [CF-030.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 30.2 [CF-030.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 30.3 [CF-030.3] 目标测试、typecheck、lint、直接依赖回归。

## 31. CF-031 — 账号、凭据与交付权限预检

- [x] 31.1 [CF-031.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 31.2 [CF-031.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 31.3 [CF-031.3] 目标测试、typecheck、lint、直接依赖回归。

## 33. CF-033 — Baoyu 微信渠道适配与持久提交意图

- [x] 33.1 [CF-033.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 33.2 [CF-033.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 33.3 [CF-033.3] 目标测试、typecheck、lint、直接依赖回归。

## 34. CF-034 — 草稿回读、冲突与更新

- [x] 34.1 [CF-034.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 34.2 [CF-034.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 34.3 [CF-034.3] 目标测试、typecheck、lint、直接依赖回归。

## 35. CF-035 — 受控浏览器草稿路径

- [x] 35.1 [CF-035.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 35.2 [CF-035.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 35.3 [CF-035.3] 目标测试、typecheck、lint、直接依赖回归。

## 36. CF-036 — 工作稿/已验证交付包导出

- [x] 36.1 [CF-036.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 36.2 [CF-036.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 36.3 [CF-036.3] 目标测试、typecheck、lint、直接依赖回归。

## 39. CF-039 — 30篇内容评测与编辑质量回归

- [x] 39.1 [CF-039.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 39.2 [CF-039.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 39.3 [CF-039.3] 目标测试、typecheck、lint、直接依赖回归。

## 44. CF-044 — Separate host/source/channel context and resolve ambiguity

- [x] 44.1 [CF-044.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 44.2 [CF-044.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 44.3 [CF-044.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 44.4 [CF-044.4] 原要求与证据复核、独立 review/commit。

## 45. CF-045 — Versioned profiles and per-format recipe registry

- [x] 45.1 [CF-045.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 45.2 [CF-045.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 45.3 [CF-045.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 45.4 [CF-045.4] 原要求与证据复核、独立 review/commit。

## 46. CF-046 — Single-harness platform-aware routing

- [x] 46.1 [CF-046.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 46.2 [CF-046.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 46.3 [CF-046.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 46.4 [CF-046.4] 原要求与证据复核、独立 review/commit。

## 47. CF-047 — Shared vendor integration and semantic adaptation

- [x] 47.1 [CF-047.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 47.2 [CF-047.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 47.3 [CF-047.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 47.4 [CF-047.4] 原要求与证据复核、独立 review/commit。

## 48. CF-048 — Channel-specialized candidate conformance

- [x] 48.1 [CF-048.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 48.2 [CF-048.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 48.3 [CF-048.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 48.4 [CF-048.4] 原要求与证据复核、独立 review/commit。

## 50. CF-050 — Channel-native source-grounded writing and editing

- [x] 50.1 [CF-050.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 50.2 [CF-050.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 50.3 [CF-050.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 50.4 [CF-050.4] 原要求与证据复核、独立 review/commit。

## 51. CF-051 — Channel-format media briefs and external receipts

- [x] 51.1 [CF-051.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 51.2 [CF-051.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 51.3 [CF-051.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 51.4 [CF-051.4] 原要求与证据复核、独立 review/commit。

## 53. CF-053 — Per-action channel delivery capabilities

- [x] 53.1 [CF-053.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 53.2 [CF-053.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 53.3 [CF-053.3] 目标测试、typecheck、lint、直接依赖回归。

## 54. CF-054 — Metrics and comment-draft feedback

- [x] 54.1 [CF-054.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 54.2 [CF-054.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 54.3 [CF-054.3] 目标测试、typecheck、lint、直接依赖回归。
- [x] 54.4 [CF-054.4] 原要求与证据复核、独立 review/commit。

## 56. CF-056 — Routing corpus, adversarial inputs and native quality

- [x] 56.1 [CF-056.1] 正反例 fixture 与精确断言，确认业务 RED。
- [x] 56.2 [CF-056.2] 实现任务卡输入输出和拒绝路径，确认 GREEN。
- [x] 56.3 [CF-056.3] 目标测试、typecheck、lint、直接依赖回归。
