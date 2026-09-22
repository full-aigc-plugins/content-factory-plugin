import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { strToU8, zipSync } from "fflate";

import { createFormatAdapter } from "../../adapters/content-methods/format.ts";
import { importDocxSource } from "../../packages/core/src/content/import-docx.ts";
import { defineDeliveryAccount } from "../../packages/core/src/delivery/accounts.ts";
import {
  approveDeliveryIntent,
  validateApprovedDelivery
} from "../../packages/core/src/delivery/approve.ts";
import { exportDeliveryPackage } from "../../packages/core/src/delivery/export.ts";
import { createDeliveryIntent } from "../../packages/core/src/delivery/intents.ts";
import { preflightDeliveryAccount } from "../../packages/core/src/delivery/preflight.ts";
import { prepareReleaseBundle } from "../../packages/core/src/delivery/prepare.ts";
import { fetchWebSource } from "../../packages/core/src/content/fetch-source.ts";
import { freezeCanonicalText } from "../../packages/core/src/render/canonical-text.ts";
import { renderFrozenVariant } from "../../packages/core/src/render/pipeline.ts";
import { LayeredSecretProvider } from "../../packages/core/src/security/credentials.ts";
import { openWorkspace } from "../../packages/core/src/workspace/store.ts";

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-security-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

function delivery() {
  const bundle = prepareReleaseBundle({
    bundleId: "bundle-1",
    variantRef: "variant-1",
    contentRevisionId: "revision-1",
    packageStatus: "verified",
    targetAccountAlias: "内容平台主账号",
    title: "标题",
    summary: "摘要",
    body: "正文",
    assets: [],
    detectionReviewRef: "review-1"
  });
  const intent = createDeliveryIntent({
    intentId: "intent-1",
    bundle,
    preflight: {
      status: "ready",
      accountAlias: bundle.targetAccountAlias,
      deliveryMethod: "api-draft"
    }
  });
  const approval = approveDeliveryIntent({
    intent,
    actor: { kind: "human", id: "editor-1" },
    interactionTrusted: true,
    approvedAt: "2026-09-22T16:30:00.000Z"
  });
  return { bundle, intent, approval };
}

test("CF-037 SSRF redirect to link-local metadata is blocked before a second request", async () => {
  const calls = [];
  await assert.rejects(
    fetchWebSource({
      url: "https://example.com/start",
      resolveHost: async host => host === "example.com"
        ? ["93.184.216.34"]
        : ["169.254.169.254"],
      async transport(url) {
        calls.push(String(url));
        return new Response(null, {
          status: 302,
          headers: { location: "http://169.254.169.254/latest/meta-data" }
        });
      }
    }),
    error => error?.code === "SOURCE_URL_PRIVATE_NETWORK"
  );
  assert.deepEqual(calls, ["https://example.com/start"]);
});

test("CF-037 export cannot follow a symlink outside its authorized root", async t => {
  const root = await sandbox(t);
  const allowedRoot = path.join(root, "allowed");
  const outside = path.join(root, "outside");
  await mkdir(allowedRoot);
  await mkdir(outside);
  await symlink(outside, path.join(allowedRoot, "escape"));

  await assert.rejects(
    exportDeliveryPackage({
      allowedRoot,
      destination: path.join(allowedRoot, "escape", "package"),
      kind: "working",
      variant: {
        variantId: "variant-1",
        packageStatus: "working",
        markdown: "# title",
        html: "<h1>title</h1>",
        contentPlatformHtml: "<h1>title</h1>"
      },
      readiness: {
        visuals: "not-required",
        detection: "not-required",
        delivery: "not-required"
      },
      missingRequirements: [],
      assets: [],
      sources: [],
      reports: [],
      receipt: null,
      includeInternalAudit: false
    }),
    error => error?.code === "DELIVERY_EXPORT_PATH_ESCAPE"
  );
});

test("CF-037 unsafe rendered HTML is rejected before export", async () => {
  const frozen = freezeCanonicalText({
    variantId: "variant-1",
    title: "安全标题",
    summary: "摘要",
    body: "正文",
    captions: [],
    citations: []
  });
  const adapter = createFormatAdapter({
    async format(fields) {
      return { ...fields, markdown: fields.body };
    },
    async render(markdown, fields) {
      return {
        html: `<img src="x" onerror="alert(1)"><p>${markdown}</p>`,
        markdown,
        visibleFields: fields
      };
    }
  });

  assert.deepEqual(
    await renderFrozenVariant({ frozen, adapter, themeRevision: "security@1" }),
    { status: "failed", reason: "unsafe-rendered-html" }
  );
});

test("CF-037 DOCX external relationships are rejected without network resolution", async t => {
  const root = await sandbox(t);
  const store = await openWorkspace(path.join(root, "workspace"));
  t.after(async () => store.close());
  const malicious = zipSync({
    "word/document.xml": strToU8(
      "<w:document xmlns:w=\"w\"><w:body><w:p><w:t>正文</w:t></w:p></w:body></w:document>"
    ),
    "word/_rels/document.xml.rels": strToU8(
      "<Relationships><Relationship TargetMode=\"External\" Target=\"http://127.0.0.1/secret\"/></Relationships>"
    )
  });

  await assert.rejects(
    importDocxSource(store, { fileName: "malicious.docx", bytes: malicious }),
    error => error?.code === "DOCUMENT_EXTERNAL_RELATIONSHIP_UNSUPPORTED"
  );
});

test("CF-037 credential sentinel never enters logs results or account mismatch details", async () => {
  const sentinel = "CF_SECRET_SENTINEL_DO_NOT_LOG";
  const messages = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args) => messages.push(args.join(" "));
  console.error = (...args) => messages.push(args.join(" "));
  try {
    const result = await preflightDeliveryAccount({
      account: defineDeliveryAccount({
        alias: "内容平台主账号",
        credentialRef: "CONTENT_PLATFORM_PRIMARY",
        expectedRemoteAccountId: "expected-account",
        deliveryMethod: "api-draft"
      }),
      approvedAccountAlias: "内容平台主账号",
      requiredPermissions: ["draft-write"],
      credentialProvider: new LayeredSecretProvider({
        system: { async resolve() { return sentinel; } },
        environment: { async resolve() { return null; } }
      }),
      async probe({ secret }) {
        assert.equal(secret, sentinel);
        return { remoteAccountId: "wrong-account", permissions: ["draft-write"] };
      }
    });
    assert.equal(result.reason, "remote-account-mismatch");
    assert.equal(JSON.stringify(result).includes(sentinel), false);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
  assert.equal(messages.join("\n").includes(sentinel), false);
});

test("CF-037 forged approval record cannot authorize a delivery", () => {
  const { bundle, intent, approval } = delivery();
  const forged = {
    ...approval,
    actorKind: "model",
    remoteWriteAuthorized: true
  };

  assert.deepEqual(validateApprovedDelivery({
    intent,
    approval: forged,
    currentBundle: bundle
  }), {
    allowed: false,
    reason: "approval-record-invalid"
  });
});

test("CF-037 release audit validates pinned dependency and license evidence", () => {
  const audit = spawnSync(process.execPath, ["scripts/audit-release.mjs", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(audit.status, 0, audit.stderr || audit.stdout);
  const report = JSON.parse(audit.stdout);
  assert.equal(report.status, "passed");
  assert.deepEqual(report.checks, {
    runtimeDependenciesPinned: true,
    runtimeDependencyNoticesPresent: true,
    vendorLocksImmutable: true,
    vendorLicenseEvidencePresent: true,
    pluginLicensePresent: true,
    buildGateDeclared: true
  });
});
