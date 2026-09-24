# Content Factory · 内容工厂

> 从真实素材到可发布内容的生产、审校与交付插件。

[English](README.md) | **简体中文**

## 当前状态

Content Factory 已具备可运行的离线 Runtime 和失败关闭的发行门禁，但还不是生产发行版。

| 任务 | 状态 | 说明 |
|---|---|---|
| CF-001～002、005～024、037～038、040、043～052、054～055、058 | ✅ COMPLETE | 供应链、Runtime Kernel、Harness、导入/编辑/排版/导出、路由、恢复、安全和失败关闭发行门 |
| CF-003～004 | PARTIAL_OFFLINE | AI 内容检测平台已有一次脱敏官网观察，但正式 API 契约和内容平台文章账号探测仍为 `NOT_RUN` |
| CF-025～036、039、041、053、056～057 | PARTIAL_OFFLINE | 离线合同通过；真实服务、账号、宿主会话或人工评审仍为 `NOT_RUN` |
| v1.0.0 发行 | **BLOCKED** | 发行需要不可变候选和完整真实证据；当前细节在安装包之外的 `docs/verification/` 中维护 |

当前基线包含跨平台自动化回归、16 个渠道档案、39 个明确的渠道形式配方、3 份宿主清单、不可变 Vendor Skills 和唯一的 `content-harness`。精确测试数量以当前 CI 输出为准，不固化在文档中。离线验证不等于真实宿主或真实账号验证。

## 快速验证

需要 Node.js 24+：

```bash
npm install --ignore-scripts
npm run lint
npm run typecheck
npm test
npm run skills:check
npm run build
npm run doctor
npm run release:gate
```

`npm run skills:check` 默认离线验证 vendored Skill 内容摘要；`npm run skills:check:upstream` 会额外检查上游 tag 解析。`npm run release:gate` 当前会按设计返回非零状态，并列出缺少的真实证据。

## 朱雀密钥的本机设置

在源码目录运行 `npm run zhuque:setup`，会打开 Content Factory 自带的本地设置页。若宿主已加载本版 MCP，也可以直接对 Agent 说“打开 Content Factory 的朱雀密钥设置”，由 `content_factory_zhuque_setup` 打开。请在页面输入密钥，不要把密钥发到聊天中。页面只监听 `127.0.0.1`，十分钟后自动关闭；保存的密钥位于当前用户的配置目录（macOS/Linux 默认为 `~/.config/content-factory/credentials.json`），Unix 权限限制为仅当前用户可读写。当前进程设置的 `ZHUQUE_API_KEY` 优先于本机保存值。

`npm run zhuque:status` 或 MCP 的 `content_factory_zhuque_status` 只显示是否已配置，不回显密钥。**保存成功不等于 API Key 有效，也不等于文章已通过检测。**设置页不会发送文章或调用朱雀 API；真实检测仍受正文外发许可、实际服务响应与文章版本核对约束。当前这项改动仅解决本机配置入口，不解除 CF-025/CF-030 及正式发行门禁。

## 架构

Content Factory 的核心约束：

```text
HostContext + SourceContext + ChannelIntent
                    │
                    ▼
             content-harness
                    │
          ChannelProfile/Recipe
                    │
         admitted Vendor Skills
                    │
                    ▼
              Runtime Kernel
       revision / fact / approval
       detection / delivery / recovery
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    Image Factory        channel adapters
```

- 只有一个 plugin-local Skill：`content-harness`。
- 通用研究、写作、翻译、编辑、排版优先复用经过锁定和审查的 Vendor Skills。
- 图片生成统一委托 Image Factory，不在 Content Factory 重建。
- 远程交付必须绑定明确账号、版本和用户授权；返回成功不等于已核验。
- 来源平台、执行宿主和目标渠道保持独立。

## 文档入口

- [完整架构](docs/architecture/Content-Factory-Architecture.zh_CN.md)
- [OpenSpec 入口](openspec/README.md)
- [实施任务 CF-001～CF-058](openspec/changes/implement-content-factory-architecture/tasks.md)
- [实施阶段与依赖](openspec/changes/implement-content-factory-architecture/plan.md)
- [架构与任务追踪](openspec/changes/implement-content-factory-architecture/traceability.md)
- [任务验证证据](docs/verification/tasks/)
- [验证状态说明](docs/guides/status-and-verification.md)
- [被阻断的发行候选](docs/verification/release-candidate.json)
- [整合发行结果](docs/verification/channel-release.md)

## 当前 Vendor 基线

`skills.lock.json` 当前锁定：

- `full-aigc-skills/baoyu-skills@v1.63.0`
- commit: `c1e1526c84fd07d71d9d12e9845dceeb366d1b42`
- `baoyu-format-markdown`
- `baoyu-markdown-to-html`
- MIT license provenance

生成图片相关 Baoyu Skills 不进入本插件。

## 发行边界

当前没有创建 `v1.0.0` 标签、Release、包发布或市场更新。剩余门槛需要授权外部账号、真实 Codex/ZCode/Kimi 会话、AI 内容检测平台正式 API 三类样本证据、内容平台草稿保存与回读，以及 30 篇内容的双人评审。所有证据绑定到同一个 commit 和包摘要以前，发行状态保持 **BLOCKED**。
