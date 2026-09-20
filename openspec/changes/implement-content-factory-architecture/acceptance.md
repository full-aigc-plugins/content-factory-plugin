# 架构与实施分解验收

## 文档交付门槛

| 编号 | 检查 | 通过条件 |
|---|---|---|
| D01 | 三部分正文保真 | 捕获原件正文完整位于架构文件内，不用摘要代替 |
| D02 | 图示保真 | 三张主图和 Recipe 示例图共四个 text 块逐字节一致 |
| D03 | 架构命名与结构 | 一个 H1；文件名符合 `*-Architecture.zh_CN.md`；代码块闭合 |
| D04 | 父/子覆盖 | CF-001–058 各存在一次，四子项各存在一次，共 232；无已勾选项 |
| D05 | 有效依赖 | 全部依赖可解析且 DAG 无环，CF-058 在 CF-042 前 |
| D06 | 渠道/形式 | 16 渠道、39 个已声明形式组合，不混入 growth/podcast/baidu 发布器 |
| D07 | 责任完整 | 各卡有 files/input/output/dependencies/negative/test/evidence |
| D08 | 规格结构 | 12 Requirement、24 Scenario，均有 WHEN/THEN |
| D09 | 链接与空白 | 新增文档内部链接可解析，diff 无意外空白 |
| D10 | 远端保全 | 原两个变更不修改；提交树中新文件 blob 与本地一致 |

## 产品实现门槛

D01–D10 不能证明产品实现；还必须按原验收完成每项 CF 父任务、fixture/live/人工审阅/宿主矩阵。任务明细反例至少覆盖来源目标混淆、原文事实破坏、Vendor 漂移、未授权回退、媒体误绑、检测过期、审批后替换和未知写入恢复。

公众号草稿和普通工作稿导出必须分开报告。其他渠道的 author/export/read/draft/public action 有独立证据级别；未运行的保持 NOT_RUN，不将一个账号的结果推广到全部账号。发布 CF-042 同时依赖基础门槛和 CF-058。

## 验证命令

```bash
python3 docs/architecture/verify-architecture.py
openspec --version
openspec status --change implement-content-factory-architecture --json
openspec validate implement-content-factory-architecture --strict --no-interactive
```

官方命令必须在真正安装 CLI 后执行并保存版本与退出码；若对全仓执行严格校验发现旧 delta 格式不合规，另做只改格式的审查，不直接覆盖旧原文或把本变更通过推广成全仓通过。
