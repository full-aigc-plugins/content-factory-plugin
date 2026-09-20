# 架构 → 实现任务 → 证据追踪

本表列出原 58 个父任务及其执行明细。每父任务固定包含 `.1` 测试 RED、`.2` 实现 GREEN、`.3` 回归、`.4` 证据与提交四项；仅完成文档不改变状态。

| 父任务 | 架构章节 | 子任务范围 | 测试入口 | 证据 |
|---|---|---|---|---|
| CF-001 | 1、3、4、5、6、8、9、10、11 | CF-001.1–.4 | `tests/contract/manifests.test.ts` | `docs/verification/tasks/CF-001.json` |
| CF-002 | 1、3、4、5、6、8、9、10、11 | CF-002.1–.4 | `tests/contract/doctor.test.ts` | `docs/verification/tasks/CF-002.json` |
| CF-003 | 1、4、5、6、9、11 | CF-003.1–.4 | `tests/contract/zhuque-probe.test.ts` | `docs/verification/tasks/CF-003.json` |
| CF-004 | 1、4、5、6、9、11 | CF-004.1–.4 | `tests/contract/wechat-probe.test.ts` | `docs/verification/tasks/CF-004.json` |
| CF-005 | 1、4、5、6、9、11 | CF-005.1–.4 | `tests/contract/render-parity.test.ts` | `docs/verification/tasks/CF-005.json` |
| CF-006 | 1、3、4、6、8、9、11 | CF-006.1–.4 | `tests/contract/image-bridge.test.ts` | `docs/verification/tasks/CF-006.json` |
| CF-007 | 1、3、4、5、6、8、9、10、11 | CF-007.1–.4 | `tests/integration/workspace.test.ts` | `docs/verification/tasks/CF-007.json` |
| CF-008 | 1、4、5、6、9、11 | CF-008.1–.4 | `tests/integration/import-text.test.ts` | `docs/verification/tasks/CF-008.json` |
| CF-009 | 1、4、5、6、9、11 | CF-009.1–.4 | `tests/integration/fetch-source.test.ts` | `docs/verification/tasks/CF-009.json` |
| CF-010 | 1、4、5、6、9、11 | CF-010.1–.4 | `tests/integration/import-documents.test.ts` | `docs/verification/tasks/CF-010.json` |
| CF-011 | 1、4、5、6、9、11 | CF-011.1–.4 | `tests/integration/revisions.test.ts` | `docs/verification/tasks/CF-011.json` |
| CF-012 | 1、3、4、5、6、8、9、10、11 | CF-012.1–.4 | `tests/integration/recovery.test.ts` | `docs/verification/tasks/CF-012.json` |
| CF-013 | 1、3、4、5、6、8、9、10、11 | CF-013.1–.4 | `tests/contract/brief-routing.test.ts` | `docs/verification/tasks/CF-013.json` |
| CF-014 | 1、2、4、6、7、8、9、11 | CF-014.1–.4 | `tests/integration/author-profile.test.ts` | `docs/verification/tasks/CF-014.json` |
| CF-015 | 1、2、4、6、7、8、9、11 | CF-015.1–.4 | `tests/integration/claims.test.ts` | `docs/verification/tasks/CF-015.json` |
| CF-016 | 1、2、4、6、7、8、9、11 | CF-016.1–.4 | `tests/e2e/writing-flow.test.ts` | `docs/verification/tasks/CF-016.json` |
| CF-017 | 1、2、4、6、7、8、9、11 | CF-017.1–.4 | `tests/integration/fact-guards.test.ts` | `docs/verification/tasks/CF-017.json` |
| CF-018 | 1、2、4、6、7、8、9、11 | CF-018.1–.4 | `tests/e2e/humanize.test.ts` | `docs/verification/tasks/CF-018.json` |
| CF-019 | 1、2、4、6、7、8、9、11 | CF-019.1–.4 | `tests/e2e/repurpose.test.ts` | `docs/verification/tasks/CF-019.json` |
| CF-020 | 1、3、4、6、8、9、11 | CF-020.1–.4 | `tests/integration/assets.test.ts` | `docs/verification/tasks/CF-020.json` |
| CF-021 | 1、3、4、6、8、9、11 | CF-021.1–.4 | `tests/integration/image-generation.test.ts` | `docs/verification/tasks/CF-021.json` |
| CF-022 | 1、4、5、6、9、11 | CF-022.1–.4 | `tests/integration/render-text.test.ts` | `docs/verification/tasks/CF-022.json` |
| CF-023 | 1、4、5、6、9、11 | CF-023.1–.4 | `tests/e2e/themes.test.ts` | `docs/verification/tasks/CF-023.json` |
| CF-024 | 1、4、5、6、9、11 | CF-024.1–.4 | `tests/e2e/review-preview.test.ts` | `docs/verification/tasks/CF-024.json` |
| CF-025 | 1、4、5、6、9、11 | CF-025.1–.4 | `tests/contract/zhuque-adapter.test.ts` | `docs/verification/tasks/CF-025.json` |
| CF-026 | 1、4、5、6、9、11 | CF-026.1–.4 | `tests/integration/detection-segments.test.ts` | `docs/verification/tasks/CF-026.json` |
| CF-027 | 1、4、5、6、9、11 | CF-027.1–.4 | `tests/integration/detection-policy.test.ts` | `docs/verification/tasks/CF-027.json` |
| CF-028 | 1、4、5、6、9、11 | CF-028.1–.4 | `tests/integration/invalidation.test.ts` | `docs/verification/tasks/CF-028.json` |
| CF-029 | 1、4、5、6、9、11 | CF-029.1–.4 | `tests/integration/budgets.test.ts` | `docs/verification/tasks/CF-029.json` |
| CF-030 | 1、4、5、6、9、11 | CF-030.1–.4 | `tests/e2e/detection-flow.test.ts` | `docs/verification/tasks/CF-030.json` |
| CF-031 | 1、4、5、6、9、11 | CF-031.1–.4 | `tests/integration/account-preflight.test.ts` | `docs/verification/tasks/CF-031.json` |
| CF-032 | 1、4、5、6、9、11 | CF-032.1–.4 | `tests/integration/delivery-approval.test.ts` | `docs/verification/tasks/CF-032.json` |
| CF-033 | 1、4、5、6、9、11 | CF-033.1–.4 | `tests/integration/wechat-submit.test.ts` | `docs/verification/tasks/CF-033.json` |
| CF-034 | 1、4、5、6、9、11 | CF-034.1–.4 | `tests/integration/wechat-readback.test.ts` | `docs/verification/tasks/CF-034.json` |
| CF-035 | 1、4、5、6、9、11 | CF-035.1–.4 | `tests/e2e/wechat-browser.test.ts` | `docs/verification/tasks/CF-035.json` |
| CF-036 | 1、4、5、6、9、11 | CF-036.1–.4 | `tests/e2e/export.test.ts` | `docs/verification/tasks/CF-036.json` |
| CF-037 | 1、3、4、5、6、8、9、10、11 | CF-037.1–.4 | `tests/security/release-security.test.ts` | `docs/verification/tasks/CF-037.json` |
| CF-038 | 1、3、4、5、6、8、9、10、11 | CF-038.1–.4 | `tests/chaos/end-to-end-recovery.test.ts` | `docs/verification/tasks/CF-038.json` |
| CF-039 | 1、4、5、6、9、11 | CF-039.1–.4 | `tests/e2e/corpus.test.ts` | `docs/verification/tasks/CF-039.json` |
| CF-040 | 1、3、4、5、6、8、9、10、11 | CF-040.1–.4 | `tests/install/clean-install.test.ts` | `docs/verification/tasks/CF-040.json` |
| CF-041 | 1、3、4、5、6、8、9、10、11 | CF-041.1–.4 | `tests/e2e/host-contract.test.ts` | `docs/verification/tasks/CF-041.json` |
| CF-042 | 1、3、4、5、6、8、9、10、11 | CF-042.1–.4 | `tests/contract/release-gate.test.ts` | `docs/verification/tasks/CF-042.json` |
| CF-043 | 1、2、3、5、6、7、8、9、11 | CF-043.1–.4 | `tests/channels/candidate-intake.test.ts` | `docs/verification/tasks/CF-043.json` |
| CF-044 | 1、2、3、5、6、7、8、9、11 | CF-044.1–.4 | `tests/channels/context.test.ts` | `docs/verification/tasks/CF-044.json` |
| CF-045 | 1、2、3、5、6、7、8、9、11 | CF-045.1–.4 | `tests/channels/profiles.test.ts` | `docs/verification/tasks/CF-045.json` |
| CF-046 | 1、2、3、5、6、7、8、9、11 | CF-046.1–.4 | `tests/channels/harness-routing.test.ts` | `docs/verification/tasks/CF-046.json` |
| CF-047 | 1、2、3、5、6、7、8、9、11 | CF-047.1–.4 | `tests/channels/vendor-methods.test.ts` | `docs/verification/tasks/CF-047.json` |
| CF-048 | 1、2、3、5、6、7、8、9、11 | CF-048.1–.4 | `tests/channels/channel-candidates.test.ts` | `docs/verification/tasks/CF-048.json` |
| CF-049 | 1、2、3、5、6、7、8、9、11 | CF-049.1–.4 | `tests/channels/skill-routing.test.ts` | `docs/verification/tasks/CF-049.json` |
| CF-050 | 1、2、3、5、6、7、8、9、11 | CF-050.1–.4 | `tests/channels/native-writing.test.ts` | `docs/verification/tasks/CF-050.json` |
| CF-051 | 1、2、3、5、6、7、8、9、11 | CF-051.1–.4 | `tests/channels/media-boundary.test.ts` | `docs/verification/tasks/CF-051.json` |
| CF-052 | 1、2、3、5、6、7、8、9、11 | CF-052.1–.4 | `tests/channels/variant-isolation.test.ts` | `docs/verification/tasks/CF-052.json` |
| CF-053 | 1、2、3、5、6、7、8、9、11 | CF-053.1–.4 | `tests/channels/delivery-capabilities.test.ts` | `docs/verification/tasks/CF-053.json` |
| CF-054 | 1、2、3、5、6、7、8、9、11 | CF-054.1–.4 | `tests/channels/feedback.test.ts` | `docs/verification/tasks/CF-054.json` |
| CF-055 | 1、2、3、5、6、7、8、9、11 | CF-055.1–.4 | `tests/channels/constraints.test.ts` | `docs/verification/tasks/CF-055.json` |
| CF-056 | 1、2、3、5、6、7、8、9、11 | CF-056.1–.4 | `tests/channels/channel-acceptance.test.ts` | `docs/verification/tasks/CF-056.json` |
| CF-057 | 1、2、3、5、6、7、8、9、11 | CF-057.1–.4 | `tests/channels/host-channel-contract.test.ts` | `docs/verification/tasks/CF-057.json` |
| CF-058 | 1、2、3、5、6、7、8、9、11 | CF-058.1–.4 | `tests/channels/channel-release.test.ts` | `docs/verification/tasks/CF-058.json` |

## 不被新分解取代的门槛

V1 基础来源、隐私、事实、检测、交付、安装和发布门槛继续有效；平台变更的 28 条要求与 R01–R42 原场景继续有效。新增结构验收见 [acceptance.md](acceptance.md)，不是对原测试的降级或替代。完整[架构正文](../../../docs/architecture/Content-Factory-Architecture.zh_CN.md)的三部分和四个 text 块在 [preservation.json](../../../docs/architecture/preservation.json) 中固定摘要。

## 路线终点

CF-057（真实宿主/渠道验证）→ CF-058（整合门槛）→ CF-042（正式发行）。技术实现通过不等于公开发布授权；文档版本 1.0 不等于插件 v1.0.0。
