# Content Factory · 内容工厂

> 从真实素材到可发布内容的生产、审校与交付插件。

[English](README.md) | **简体中文**

## 当前状态

项目已经进入真实实现阶段，不再只是架构文档仓库。

| 任务 | 状态 | 说明 |
|---|---|---|
| CF-001 | ✅ COMPLETE | 不可变 Vendor Skill 供应链、local harness 保护、同步/校验入口 |
| CF-002 | ✅ COMPLETE | CLI/MCP 引导、Codex/ZCode/Kimi 宿主探测、lint/typecheck/build/CI 门禁 |
| CF-005 | 🚧 IN_PROGRESS | Baoyu v1.63.0 的 Markdown 排版与 HTML 转换 Skill 已锁定并 vendored；正式回执待闭合 |
| 其他 CF-003～CF-058 | ⏳ NOT_STARTED / blocked by dependencies | 按 OpenSpec 依赖继续推进 |

当前 `main` 已包含实际代码：`package.json`、CLI/MCP、host probe、供应链脚本、`skills.lock.json`、唯一 `content-harness`、Baoyu 格式化 Skill、测试与 CI。

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
```

`npm run skills:check` 默认离线验证 vendored Skill 内容摘要；`npm run skills:check:upstream` 会额外检查上游 tag 解析。

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

## 当前 Vendor 基线

`skills.lock.json` 当前锁定：

- `full-aigc-skills/baoyu-skills@v1.63.0`
- commit: `c1e1526c84fd07d71d9d12e9845dceeb366d1b42`
- `baoyu-format-markdown`
- `baoyu-markdown-to-html`
- MIT license provenance

生成图片相关 Baoyu Skills 不进入本插件。

## 下一步

依赖图允许继续推进 CF-003、CF-004、CF-006、CF-007、CF-043、CF-044；CF-005 完成回执闭合后可解锁依赖它的 CF-022 / CF-047 等任务。

正式 `v1.0.0` 只有在基础 P0、平台路由、真实宿主、真实检测、真实公众号草稿回读和整合发行门禁全部通过后才发布。
