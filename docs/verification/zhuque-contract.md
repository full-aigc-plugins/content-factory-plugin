# AI 内容检测平台契约观察

## 证据结论

当前状态为 `PARTIAL_LIVE_WEBSITE`。2026-09-22 使用官网游客额度完成了四次可绑定文本的检测，并记录了一次未发出网络请求的空文本反例、一次历史验证码边界和一次因返回文本与提交文本不一致而拒收的响应。前三份有效输入来自仓库自有、可再分发的合成 fixture，第四份来自官网内置人工示例三；所有记录均不含用户私密材料。原始基线与编辑候选稿只用于观察同一项目语料在官网试用中的返回结构，不证明作者身份或“去 AI”效果。

这次观察只证明官网在当时能够接收包含中文、换行和 Emoji 的文本并返回分类比例与分段结果。它不证明 API Key 鉴权、API 用量字段、网页/API 一致性、稳定限额或生产可用性。

## 已观察边界

- 空文本在客户端以“检测文本长度需大于350字”阻断，网络请求数为零，游客额度未变化。
- 成功样本的 SHA-256 为 `34ae95c92ee27328622d4acad86df8515b2a29c641204c7592626fde075b2d97`。
- 官网有效长度为 767；输入包含 828 个 Unicode 标量、829 个 UTF-16 code unit、2199 个 UTF-8 字节。
- 返回 `status=success`、三类比例和两个分段；第二个分段含 Emoji，观察到的 `position=[525,303]` 与 Unicode 标量长度一致，不能擅自解释为 UTF-16 结束下标。
- 合成原始基线的 SHA-256 为 `4b71d9d8e0e264a0e3fa6fd8a84739a6735c26c503b0f5552080f289434d7f66`，返回比例为人工 `0`、AI `0`、疑似 `1`，游客额度从 4 变为 3。
- 编辑候选稿的 SHA-256 为 `c11fc98f31e79e04f0b34b7296cc08434f24d1c8e05e681e9da2b1016ebbe21a`，返回比例为人工 `0.2695`、AI `0`、疑似 `0.7305`，游客额度从 3 变为 2。
- 原始基线与编辑候选稿的返回差异只是一组网站观察，不是因果结论，也不是质量门槛。
- 第一次人工示例三提交停在交互验证码，保留为历史 `NOT_RUN_USER_CHALLENGE`；验证码未绕过，也没有伪造响应。
- 恢复后的第一次提交虽消耗一次额度，但返回分段拼接文本的 SHA-256 为 `0d0370434f70950b897bb36628f6d26bdf046b2d3298ec8e17721bb43e9d18c7`，与提交文本不一致，因此整条分类被标记为 `REJECTED_LIVE_WEBSITE_BINDING_MISMATCH`，不得进入比较结果。
- 第二次恢复提交在发送前校验官网内置人工示例三正文、文本框状态和页面组件状态三者哈希一致；请求 SHA-256 与返回分段拼接 SHA-256 均为 `0fb04c9319ca0caf0e3ce5414aff18b7b522be8aeb1c9de6a8b1e14e93bb79d1`。正文不入库，游客额度从 1 变为 0；返回比例为人工 `1`、AI `0`、疑似 `0`。该分类仍不是作者身份或质量证据。
- 响应含短期反馈令牌。令牌已删除，仅记录“存在且已脱敏”，禁止写入 fixture、日志或任务回执。
- 页面提示结果仅供辅助判断，不应作为审核或处罚的决定性依据；插件同样不得把结果解释成作者身份或质量证明。

脱敏后的机器证据位于：

- `tests/fixtures/zhuque/2026-09-22-website-observation.json`
- `tests/fixtures/zhuque/2026-09-22-original-ai-website-observation.json`
- `tests/fixtures/zhuque/2026-09-22-edited-website-observation.json`
- `tests/fixtures/zhuque/2026-09-22-human-website-attempt.json`
- `tests/fixtures/zhuque/2026-09-22-human-website-mismatch.json`
- `tests/fixtures/zhuque/2026-09-22-human-website-observation.json`

## API 边界

官方 API 文档当前列出的文本模型为 `@makers/zhuque-text`，请求需要 API Key，并分别返回模型自身用量与 Makers 免费额度扣减字段。本轮向官方端点发送了一次不带认证头的最小请求，真实观察到 HTTP 401、`type=auth_missing`、`code=auth_missing`；没有发送凭据，付费调用为零，响应头中的请求追踪标识已删除。

由于本轮没有 API Key，带认证的成功调用、HTTP 200 业务失败、`usage`、`makers_models_usage` 以及网页/API 一致性仍保持 `NOT_RUN_CREDENTIAL_REQUIRED`。

官方文档当前还明确说明 API 仅支持文本检测；官网上的图片/视频试用能力不能被扩写为当前 API 合同。

## 未完成项

- 人工稿、原始 AI 稿、编辑稿三类独立、经过鉴权的 API 记录；当前只有三类官网观察；
- API 原始响应字节及其不可变哈希；
- 带 API Key 的成功、配额失败和 HTTP 200 业务失败真实响应；
- 独立复核与生产准入。

因此 CF-003 和 CF-030 仍未完成，发布门禁不得解除。
