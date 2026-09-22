import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  cp,
  mkdtemp,
  readFile,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

async function sandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-install-"));
  const closers = [];
  t.after(async () => {
    for (const close of closers.reverse()) await close();
    await rm(root, { recursive: true, force: true });
  });
  return {
    root,
    addCloser(close) {
      closers.push(close);
    }
  };
}

test("CF-040 distribution runs from a non-ASCII clean home without Bun or native compilation", async t => {
  const cleanup = await sandbox(t);
  const { root } = cleanup;
  const unicodeHome = path.join(root, "用户-Δ-home");
  const installed = path.join(unicodeHome, "应用", "content-factory");
  await cp(path.resolve("dist"), installed, { recursive: true });

  for (const required of [
    "LICENSE",
    "README.md",
    "README.zh-CN.md",
    "THIRD_PARTY_NOTICES.md",
    "build-manifest.json",
    "packages/cli/src/main.ts"
  ]) {
    await access(path.join(installed, required));
  }

  const nodeOnlyPath = path.dirname(process.execPath);
  const cli = spawnSync(
    process.execPath,
    [path.join(installed, "packages/cli/src/main.ts"), "doctor", "--json"],
    {
      cwd: unicodeHome,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: unicodeHome,
        USERPROFILE: unicodeHome,
        PATH: nodeOnlyPath,
        Path: nodeOnlyPath,
        CONTENT_FACTORY_HOST_ID: "codex",
        CONTENT_FACTORY_HOST_CAPABILITIES: "filesystem"
      }
    }
  );
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  const doctor = JSON.parse(cli.stdout);
  assert.equal(doctor.host.id, "codex");
  assert.equal(doctor.capabilities.filesystem.status, "available");

  const { openWorkspace } = await import(pathToFileURL(
    path.join(installed, "packages/core/src/workspace/store.ts")
  ).href);
  const { backupWorkspaceDatabase } = await import(pathToFileURL(
    path.join(installed, "packages/core/src/workspace/backup.ts")
  ).href);
  const { exportDeliveryPackage } = await import(pathToFileURL(
    path.join(installed, "packages/core/src/delivery/export.ts")
  ).href);
  const { renderReviewPage } = await import(pathToFileURL(
    path.join(installed, "packages/core/src/render/review-page.ts")
  ).href);
  const workspaceRoot = path.join(unicodeHome, "工作区");
  const store = await openWorkspace(workspaceRoot);
  cleanup.addCloser(() => store.close());
  const object = await store.putObject(Buffer.from("跨系统安装验证"));
  const exportsRoot = path.join(unicodeHome, "导出");
  const delivery = await exportDeliveryPackage({
    allowedRoot: unicodeHome,
    destination: path.join(exportsRoot, "工作稿"),
    kind: "working",
    variant: {
      variantId: "variant-install",
      packageStatus: "working",
      markdown: "# 安装验证",
      html: "<h1>安装验证</h1>",
      contentPlatformHtml: "<h1>安装验证</h1>"
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
  });
  assert.equal(delivery.status, "exported");
  const review = renderReviewPage({
    requestedRevisionId: "revision-install",
    currentRevisionId: "revision-install",
    packageStatus: "working-draft",
    current: { title: "安装验证", body: "跨系统渲染验证" },
    sources: [],
    reports: []
  });
  assert.equal(review.status, "succeeded");
  assert.match(review.html, /跨系统渲染验证/);
  const backup = await backupWorkspaceDatabase(
    store.stateDir,
    path.join(unicodeHome, "备份", "workspace.db")
  );
  await store.close();
  assert.ok(backup.bytes > 0);

  const reopened = await openWorkspace(workspaceRoot);
  cleanup.addCloser(() => reopened.close());
  assert.equal(reopened.getObjectRecord(object.sha256)?.sha256, object.sha256);
});

test("CF-040 build manifest is relocatable and contains no development-machine path", async () => {
  const manifest = JSON.parse(await readFile(
    path.resolve("dist/build-manifest.json"),
    "utf8"
  ));
  assert.equal(manifest.runtime, "node>=24-native-typescript");
  assert.ok(manifest.files.length > 0);
  assert.ok(manifest.files.every(file => !path.isAbsolute(file.path)));
  assert.ok(manifest.files.every(file => !file.path.includes("\\")));
  const serialized = JSON.stringify(manifest);
  assert.equal(serialized.includes("/Users/wandl/"), false);
});

test("CF-040 CI executes the release gate on Linux, macOS, and Windows", async () => {
  const workflow = await readFile(path.resolve(".github/workflows/ci.yml"), "utf8");
  const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8"));
  assert.match(workflow, /os:\s*\[ubuntu-latest, macos-latest, windows-latest\]/);
  assert.match(workflow, /runs-on:\s*\$\{\{\s*matrix\.os\s*\}\}/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run audit:release/);
  assert.match(packageJson.scripts.test, /--test-concurrency=1/u);
});

test("CF-040 Git checkout preserves LF source files on every runner", async () => {
  const attributes = await readFile(path.resolve(".gitattributes"), "utf8");
  assert.match(attributes, /^\* text=auto eol=lf$/m);
});
