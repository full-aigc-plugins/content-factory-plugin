# AI 内容检测平台真实验证

Live status: `PARTIAL_LIVE_WEBSITE`

本仓库已经完成本地契约、合成响应、Unicode 定位、审阅政策、失效规则、预算重试与报告渲染验证。2026-09-22 又使用官网游客额度完成了三次不含私密内容的真实网页文本探测，并记录了空文本客户端阻断。首份混合字符观察、30 条合成原始基线和相应编辑候选稿均保留精确输入哈希，短期反馈令牌全部脱敏。证据见 [首份官网观察](../../tests/fixtures/zhuque/2026-09-22-website-observation.json)、[原始基线观察](../../tests/fixtures/zhuque/2026-09-22-original-ai-website-observation.json)、[编辑稿观察](../../tests/fixtures/zhuque/2026-09-22-edited-website-observation.json) 与[契约观察说明](zhuque-contract.md)。

这些官网观察不是带 API Key 的正式 API 调用。官方 API 的无认证请求已经观察到 HTTP 401 `auth_missing`，但当前仍没有以下生产准入证据：

- 人工稿的真实 API 响应与原始响应哈希；
- 原始 AI 稿的真实 API 响应与原始响应哈希；
- 编辑稿的真实 API 响应与原始响应哈希；
- 网页结果与 API 结果的一致性对照；
- 带 API Key 的成功调用、用量字段和不可变原始响应哈希。

因此，本页、本地 fixture 和三次官网分类都不能作为生产准入证据，也不能被解释为检测通过、作者身份判断、“去 AI”成功或插件质量证明。若以后补充真实 API 验证，必须保留精确文本哈希、请求身份、不可变原始响应、策略版本和人工审阅记录。
