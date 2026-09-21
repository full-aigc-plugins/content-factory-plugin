import assert from "node:assert/strict";
import test from "node:test";

import { evaluateBindingEligibility } from "../packages/core/src/skills/eligibility.ts";
import { selectBinding } from "../packages/core/src/skills/select-binding.ts";

const context = {
  capability: "writing.social",
  hostId: "codex",
  availableRuntimes: ["node"],
  channelId: "xiaohongshu",
  formatId: "note",
  locale: "zh-CN",
  outputContract: "draft-candidate@1",
  action: "author",
  grantedPermissions: ["workspace-read"],
  approvedDataRecipients: ["local-model"],
  maxCostUsd: 0
};

function binding(overrides = {}) {
  return {
    bindingId: "primary-bun",
    skillId: "social",
    priority: 100,
    installed: true,
    integrityVerified: true,
    contractVerified: true,
    capabilities: ["writing.social"],
    hostIds: ["codex", "zcode", "kimi"],
    runtimes: ["bun"],
    channelIds: ["xiaohongshu"],
    formatIds: ["note"],
    locales: ["zh-CN"],
    outputContracts: ["draft-candidate@1"],
    allowedActions: ["author"],
    requiredPermissions: ["workspace-read"],
    dataRecipients: ["local-model"],
    estimatedCostUsd: 0,
    contractPath: "skills/social/SKILL.md",
    executionResources: ["skills/social/references/platforms.md"],
    ...overrides
  };
}

test("CF-049 filters runtime eligibility before preference and selects one compatible alternate", () => {
  const alternate = binding({
    bindingId: "alternate-node",
    priority: 50,
    runtimes: ["node"],
    contractPath: "skills/social/SKILL.md",
    executionResources: ["skills/social/references/post-templates.md"]
  });
  const result = selectBinding([binding(), alternate], context);
  assert.equal(result.status, "selected");
  assert.equal(result.primary.bindingId, "alternate-node");
  assert.deepEqual(result.rejections["primary-bun"], ["runtime-unavailable"]);
  assert.deepEqual(result.loadPlan.selection, ["binding:primary-bun", "binding:alternate-node"]);
  assert.deepEqual(result.loadPlan.execution, [
    "skills/social/SKILL.md",
    "skills/social/references/post-templates.md"
  ]);
});

test("CF-049 requires new consent when fallback changes recipient cost or permission", () => {
  const alternate = binding({
    bindingId: "remote-paid",
    priority: 50,
    runtimes: ["node"],
    requiredPermissions: ["workspace-read", "network"],
    dataRecipients: ["third-party-api"],
    estimatedCostUsd: 0.25
  });
  const result = selectBinding([binding(), alternate], context);
  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "new-consent-required");
  assert.deepEqual(result.consentChanges, {
    permissions: ["network"],
    dataRecipients: ["third-party-api"],
    additionalCostUsd: 0.25
  });
});

test("CF-049 never selects uninstalled, drifted, or contract-unverified bindings", () => {
  assert.deepEqual(evaluateBindingEligibility(binding({ installed: false }), context).reasons, ["not-installed"]);
  assert.deepEqual(evaluateBindingEligibility(binding({ integrityVerified: false }), context).reasons, ["integrity-unverified", "runtime-unavailable"]);
  assert.deepEqual(evaluateBindingEligibility(binding({ contractVerified: false, runtimes: ["node"] }), context).reasons, ["contract-unverified"]);
  const result = selectBinding([
    binding({ installed: false }),
    binding({ bindingId: "drifted", integrityVerified: false })
  ], context);
  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "no-eligible-binding");
  assert.equal("install" in result, false);
});

test("CF-049 eligibility covers channel format locale output action and budget", () => {
  const result = evaluateBindingEligibility(binding({
    runtimes: ["node"],
    channelIds: ["x"],
    formatIds: ["thread"],
    locales: ["en-US"],
    outputContracts: ["thread@1"],
    allowedActions: ["deliver"],
    estimatedCostUsd: 1
  }), context);
  assert.deepEqual(result.reasons, [
    "channel-mismatch",
    "format-mismatch",
    "locale-mismatch",
    "output-contract-mismatch",
    "action-not-allowed",
    "budget-exceeded"
  ]);
});
