import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { exportDeliveryPackage } from "../packages/core/src/delivery/export.ts";
import {
  loadExportManifest,
  verifyExportManifest
} from "../packages/core/src/delivery/manifest.ts";

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-export-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

function input(destination, overrides = {}) {
  return {
    destination,
    kind: "working",
    variant: {
      variantId: "variant-1",
      packageStatus: "working",
      markdown: "# 标题\n\n正文",
      html: "<!doctype html><html><body><h1>标题</h1><p>正文</p></body></html>",
      contentPlatformHtml: "<h1>标题</h1><p>正文</p>"
    },
    readiness: {
      visuals: "missing",
      detection: "missing",
      delivery: "not-required"
    },
    missingRequirements: ["editorial-approval"],
    assets: [{
      fileName: "cover.png",
      bytes: Buffer.from("public-cover"),
      sha256: "050b853ac06cb0e401499d0c8a436d6102ed80aaf20b284688355c1ad9dfaf04",
      visibility: "public"
    }],
    sources: [
      { sourceId: "source-public", label: "公开来源", visibility: "public" },
      { sourceId: "source-private", label: "私人访谈", visibility: "private" }
    ],
    reports: [
      { fileName: "review.json", content: "{\"status\":\"review\"}\n", visibility: "public" },
      { fileName: "private-notes.txt", content: "私人编辑备注", visibility: "internal" }
    ],
    receipt: null,
    includeInternalAudit: false,
    ...overrides
  };
}

test("CF-036 working export lists gaps and excludes private audit material by default", async t => {
  const root = await sandbox(t);
  const destination = path.join(root, "working-package");

  const result = await exportDeliveryPackage(input(destination));
  const manifest = await loadExportManifest(destination);

  assert.equal(result.status, "exported");
  assert.equal(manifest.exportKind, "working");
  assert.deepEqual(manifest.missingRequirements, [
    "detection", "editorial-approval", "visuals"
  ]);
  assert.deepEqual(manifest.sources, [
    { sourceId: "source-public", label: "公开来源", visibility: "public" }
  ]);
  assert.equal(await readFile(path.join(destination, "public/content.md"), "utf8"), "# 标题\n\n正文");
  assert.equal(await readFile(path.join(destination, "public/content.html"), "utf8"), input(destination).variant.html);
  assert.equal(await readFile(path.join(destination, "public/content-platform.html"), "utf8"), input(destination).variant.contentPlatformHtml);
  assert.equal(await readFile(path.join(destination, "public/assets/cover.png"), "utf8"), "public-cover");
  assert.equal(await readFile(path.join(destination, "public/reports/review.json"), "utf8"), "{\"status\":\"review\"}\n");
  await assert.rejects(access(path.join(destination, "audit")));
  assert.equal(JSON.stringify(manifest).includes("私人访谈"), false);
  assert.equal(JSON.stringify(manifest).includes("私人编辑备注"), false);
  assert.deepEqual(await verifyExportManifest(destination), {
    valid: true,
    mismatches: []
  });
});

test("CF-036 verified export rejects missing visuals or required detection", async t => {
  const root = await sandbox(t);
  const cases = [
    {
      readiness: { visuals: "missing", detection: "passed", delivery: "not-required" },
      reason: "visuals"
    },
    {
      readiness: { visuals: "ready", detection: "missing", delivery: "not-required" },
      reason: "detection"
    }
  ];

  for (const [index, item] of cases.entries()) {
    await assert.rejects(
      exportDeliveryPackage(input(path.join(root, `verified-${index}`), {
        kind: "verified",
        variant: { ...input("unused").variant, packageStatus: "verified" },
        readiness: item.readiness,
        missingRequirements: []
      })),
      error => error?.code === "DELIVERY_EXPORT_NOT_VERIFIED"
        && error?.details?.missingRequirements?.includes(item.reason)
    );
  }
});

test("CF-036 verified local package needs no remote write receipt", async t => {
  const root = await sandbox(t);
  const destination = path.join(root, "local-verified");

  await exportDeliveryPackage(input(destination, {
    kind: "verified",
    variant: { ...input("unused").variant, packageStatus: "verified" },
    readiness: {
      visuals: "ready",
      detection: "passed",
      delivery: "not-required"
    },
    missingRequirements: []
  }));

  const manifest = await loadExportManifest(destination);
  assert.equal(manifest.exportKind, "verified");
  assert.deepEqual(manifest.missingRequirements, []);
  assert.deepEqual(await verifyExportManifest(destination), {
    valid: true,
    mismatches: []
  });
});

test("CF-036 remote draft conflict cannot produce a verified package", async t => {
  const root = await sandbox(t);

  await assert.rejects(
    exportDeliveryPackage(input(path.join(root, "remote-conflict"), {
      kind: "verified",
      variant: { ...input("unused").variant, packageStatus: "verified" },
      readiness: {
        visuals: "ready",
        detection: "passed",
        delivery: "conflict"
      },
      missingRequirements: []
    })),
    error => error?.code === "DELIVERY_EXPORT_NOT_VERIFIED"
      && error?.details?.missingRequirements?.includes("delivery-verification")
  );
});

test("CF-036 explicit audit export keeps private sources reports and receipt outside public", async t => {
  const root = await sandbox(t);
  const destination = path.join(root, "audited-working");

  await exportDeliveryPackage(input(destination, {
    includeInternalAudit: true,
    receipt: {
      deliveryMode: "remote-draft",
      status: "verified",
      remoteDraftId: "draft-1"
    }
  }));

  const privateSources = JSON.parse(await readFile(
    path.join(destination, "audit/sources.json"), "utf8"
  ));
  assert.deepEqual(privateSources, [
    { sourceId: "source-private", label: "私人访谈", visibility: "private" }
  ]);
  assert.equal(await readFile(
    path.join(destination, "audit/reports/private-notes.txt"), "utf8"
  ), "私人编辑备注");
  assert.deepEqual(JSON.parse(await readFile(
    path.join(destination, "audit/receipt.json"), "utf8"
  )), {
    deliveryMode: "remote-draft",
    status: "verified",
    remoteDraftId: "draft-1"
  });
  const publicFiles = (await loadExportManifest(destination)).files
    .filter(file => file.path.startsWith("public/"))
    .map(file => file.path);
  assert.equal(publicFiles.some(file => file.includes("private")), false);
});

test("CF-036 export refuses conflicts and unsafe child names without overwriting", async t => {
  const root = await sandbox(t);
  const existing = path.join(root, "existing");
  await mkdir(existing);
  await writeFile(path.join(existing, "keep.txt"), "keep");

  await assert.rejects(
    exportDeliveryPackage(input(existing)),
    error => error?.code === "DELIVERY_EXPORT_DESTINATION_EXISTS"
  );
  assert.equal(await readFile(path.join(existing, "keep.txt"), "utf8"), "keep");

  const unsafe = path.join(root, "unsafe");
  await assert.rejects(
    exportDeliveryPackage(input(unsafe, {
      assets: [{
        fileName: "../escape.png",
        bytes: Buffer.from("escape"),
        sha256: "ab".repeat(32),
        visibility: "public"
      }]
    })),
    error => error?.code === "DELIVERY_EXPORT_UNSAFE_PATH"
  );
  await assert.rejects(access(path.join(root, "escape.png")));
});

test("CF-036 manifest verification detects changed package bytes", async t => {
  const root = await sandbox(t);
  const destination = path.join(root, "tamper-check");
  await exportDeliveryPackage(input(destination));

  await writeFile(path.join(destination, "public/content.md"), "tampered");

  const verification = await verifyExportManifest(destination);
  assert.equal(verification.valid, false);
  assert.deepEqual(verification.mismatches, ["public/content.md"]);
});
