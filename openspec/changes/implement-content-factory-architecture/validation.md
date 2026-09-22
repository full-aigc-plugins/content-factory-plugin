# 架构、实现与任务证据核验

最近核验日期：2026-09-22。2026-09-20 的文档保真快照仍保留在历史证据中；本页同时记录当前产品实现、任务状态和 OpenSpec 严格校验，不把离线验证当成真实账号或人工验收。

## 已执行结果

| 项目 | 结果 | 证据与范围 |
|---|---|---|
| 三部分正文 | PASS | PRESENTATION 区块与捕获原文 16,813 bytes、SHA-256 一致；只移除会话引用标记 |
| 四个 text 块 | PASS | 三张主图和一个 Recipe 示例图分别逐字节比较；摘要见 preservation.json |
| 任务/依赖 | PASS | 58 父任务、232 子项；152 已勾选、80 保持未勾选；任务卡字段齐全、依赖一致且无环 |
| 渠道形式 | PASS | 16 个 channel_id，39 个声明形式；不是发布支持声明 |
| 新规范结构 | PASS | 3 个 capability、12 个 Requirement、24 个含 WHEN/THEN 的 Scenario |
| 内部链接 | PASS | 104 个链接；本地完整目标检查与 3 个已读取 GitHub 旧文件路径的存在性检查结合 |
| 负向控制 | PASS | 改图、提前勾任务、删除 WHEN、加入发布依赖环均被检出；之后恢复原字节 |
| 任务证据 | PASS | CF-001–CF-058 共 58 份回执；38 `COMPLETE`、20 `PARTIAL_OFFLINE`；索引和任务勾选由自动化测试对齐 |
| 产品回归 | PASS_OFFLINE | 当前完整自动化套件覆盖 Runtime、Harness、供应链、渠道、恢复、安全、排版和失败关闭发行门；精确数量以对应 CI 输出为准 |
| OpenSpec CLI | PASS | OpenSpec 1.8.0；三组 change 均通过 `--strict` 校验 |
| Git 空白检查 | PASS | 当前变更范围 `git diff --check` 无输出 |
| 远端文件哈希（2026-09-20 快照） | PASS | 暂存树 aee802423e1a38da9a09d096f16f45b547654822 中 20 个上传文件的 Git blob SHA-1 与本地 bytes 一致 |
| 原变更保全（2026-09-20 快照） | PASS | 当时 establish-content-factory-v1 与平台变更子树未改变；后续实现和 OpenSpec 1.8 格式兼容修复均有独立提交与验证 |

带日期的远端哈希与原变更保全行只描述 2026-09-20 的创建前快照；不将该暂存 tree 等同于当前提交或当前已推送状态。

## 未执行与不能据此声明的结果

AI 内容检测平台的真实调用、内容平台文章账号的草稿写入与回读、Codex/ZCode/Kimi 真实宿主会话、117 个宿主×配方组合和 30 篇双人内容评审仍为 `NOT_RUN`。这些缺口对应 20 个 `PARTIAL_OFFLINE` 父任务；离线实现、Vendor 完整性、Node.js 24 构建和 CI 通过不能替代它们。

## 复核方式

在完整仓库内运行 `python3 docs/architecture/verify-architecture.py`。当前检查脚本只检查文档，不需要供应商密钥。部分文档包核验可使用 `--root` 与 `--known-paths`；后者必须来自实际读取的仓库路径，不得用猜测路径掩盖链接缺失。

当前使用 OpenSpec 1.8.0 分别运行三组严格校验。真实产品验收仍按原两组变更和本次执行任务逐项提交证据；只有新证据才能把相应 `PARTIAL_OFFLINE` 更新为 `COMPLETE`。
