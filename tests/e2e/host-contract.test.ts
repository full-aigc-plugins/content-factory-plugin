import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

type HostId = "codex" | "zcode" | "kimi";

const manifests: Record<HostId, string> = {
  codex: ".codex-plugin/plugin.json",
  zcode: ".zcode-plugin/plugin.json",
  kimi: "kimi.plugin.json"
};

test("CF-041 ships three host manifests with one package identity and real paths", async () => {
  for (const [hostId, relativePath] of Object.entries(manifests)) {
    const manifest = JSON.parse(await readFile(path.resolve(relativePath), "utf8"));
    assert.equal(manifest.name, "content-factory", hostId);
    assert.equal(manifest.version, "0.1.0", hostId);
    assert.equal(manifest.license, "Apache-2.0", hostId);
    assert.match(manifest.skills, /^\.?\/?skills\/?$/u, hostId);
    await access(path.resolve(manifest.skills));
  }
});

test("CF-041 each declared host starts the shared CLI contract without invented capabilities", () => {
  for (const hostId of Object.keys(manifests) as HostId[]) {
    const result = spawnSync(
      process.execPath,
      ["packages/cli/src/main.ts", "doctor", "--json"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          CONTENT_FACTORY_HOST_ID: hostId,
          CONTENT_FACTORY_HOST_VERSION: "contract-fixture",
          CONTENT_FACTORY_HOST_CAPABILITIES: "filesystem,!browser,!image-factory,!credential-store,!search,!mcp"
        }
      }
    );
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.host.id, hostId);
    assert.equal(report.host.status, "supported");
    assert.equal(report.capabilities.filesystem.status, "available");
    assert.equal(report.capabilities.browser.status, "unavailable");
    assert.equal(report.capabilities.imageFactory.status, "unavailable");
    assert.equal(report.paidCalls, 0);
  }
});

test("CF-041 checked-in host evidence keeps every unexecuted live run as NOT_RUN", async () => {
  const index = JSON.parse(await readFile(
    path.resolve("docs/verification/live-run-index.json"),
    "utf8"
  ));
  assert.equal(index.schemaVersion, 1);
  assert.deepEqual(index.runs.map((run: { hostId: string }) => run.hostId), [
    "codex", "zcode", "kimi"
  ]);
  for (const run of index.runs) {
    assert.equal(run.status, "NOT_RUN");
    assert.equal(run.sessionStarted, false);
    assert.equal(run.materialToExport, "NOT_RUN");
    assert.equal(run.detection, "NOT_RUN");
    assert.equal(run.draftReadback, "NOT_RUN");
    assert.equal(run.remoteEvidenceRefs.length, 0);
  }
});

test("CF-041 release build retains every host manifest without changing its bytes", async () => {
  const build = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  for (const relativePath of Object.values(manifests)) {
    const source = await readFile(path.resolve(relativePath));
    const packaged = await readFile(path.resolve("dist", relativePath));
    assert.deepEqual(packaged, source);
  }
});
