# 本次架构与任务文档核验

核验日期：2026-09-20。范围仅为本次架构、执行分解与导航，不包含产品实现。

## 已执行结果

| 项目 | 结果 | 证据与范围 |
|---|---|---|
| 三部分正文 | PASS | PRESENTATION 区块与捕获原文 16,813 bytes、SHA-256 一致；只移除会话引用标记 |
| 四个 text 块 | PASS | 三张主图和一个 Recipe 示例图分别逐字节比较；摘要见 preservation.json |
| 任务/依赖 | PASS | 58 父任务、232 未勾选执行子项，任务卡字段齐全、依赖一致且无环 |
| 渠道形式 | PASS | 16 个 channel_id，39 个声明形式；不是发布支持声明 |
| 新规范结构 | PASS | 3 个 capability、12 个 Requirement、24 个含 WHEN/THEN 的 Scenario |
| 内部链接 | PASS | 104 个链接；本地完整目标检查与 3 个已读取 GitHub 旧文件路径的存在性检查结合 |
| 负向控制 | PASS | 改图、提前勾任务、删除 WHEN、加入发布依赖环均被检出；之后恢复原字节 |
| Git 空白检查 | WARN | `git diff --cached --check` 返回 2，仅 7 个文件末尾有空行；无正文行尾空格或冲突标记，未宣称该命令通过 |
| 远端文件哈希 | PASS | 暂存树 aee802423e1a38da9a09d096f16f45b547654822 中 20 个上传文件的 Git blob SHA-1 与本地 bytes 一致 |
| 原变更保全 | PASS | establish-content-factory-v1 子树 8e48c4712638fff5c3b413acce15b09e433921d1，平台变更子树 d6dd7569ce3b7fde69326d15faf1b2e13b6f3662，均未改变 |

远端哈希行描述的是创建 commit 前的核验快照；最终提交与 main 回读结果由提交回执确认，不将暂存 tree 等同于已推送。

## 未执行与不能据此声明的结果

官方 OpenSpec CLI：NOT_RUN。当前环境无 openspec；尝试查询 npm 包时出现 EAI_AGAIN（registry.npmjs.org）。本地结构检查不替代官方严格校验，也不证明旧基线的 delta 格式通过。

Vendor 安装、Node24 产品构建、宿主运行、真实朱雀、图片生成、公众号草稿写入与回读、内容人工评测：均 NOT_RUN。全部产品父任务和执行子项保持未开始。

## 复核方式

在完整仓库内运行 `python3 docs/architecture/verify-architecture.py`。当前检查脚本只检查文档，不需要供应商密钥。部分文档包核验可使用 `--root` 与 `--known-paths`；后者必须来自实际读取的仓库路径，不得用猜测路径掩盖链接缺失。

后续具备 CLI 环境时，记录准确版本，再运行 `openspec validate implement-content-factory-architecture --strict --no-interactive`。真实产品验收仍按原两组变更和本次执行任务逐项提交证据。
