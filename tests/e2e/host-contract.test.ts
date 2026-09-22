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
    assert.equal(manifest.version, "1.0.0-rc.1", hostId);
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

test("CF-041 records observed host runtimes without promoting them to installed plugin sessions", async () => {
  const probe = JSON.parse(await readFile(
    path.resolve("docs/verification/host-runtime-preflight.json"),
    "utf8"
  ));
  assert.deepEqual(probe.operatingSystem, {
    name: "macOS",
    version: "27.0",
    build: "26A428",
    architecture: "arm64"
  });
  assert.deepEqual(probe.hosts.map((host: { hostId: string }) => host.hostId), [
    "codex", "zcode", "kimi"
  ]);
  for (const host of probe.hosts) {
    assert.equal(host.runtimeObserved, true);
    assert.equal(host.pluginInstallation, "NOT_VERIFIED");
    assert.equal(host.pluginSession, "NOT_RUN");
    assert.equal(host.accountAccess, "NOT_RUN");
    assert.equal(host.paidCalls, 0);
  }
  assert.equal(probe.secretsInRecord, false);

  const index = JSON.parse(await readFile(
    path.resolve("docs/verification/live-run-index.json"),
    "utf8"
  ));
  for (const run of index.runs) {
    assert.equal(run.runtimePreflight, "OBSERVED");
    assert.match(run.hostVersion, /\d/u);
    assert.equal(run.operatingSystem, "macOS 27.0 arm64");
    assert.deepEqual(run.preflightEvidenceRefs, [
      "docs/verification/host-runtime-preflight.json"
    ]);
    assert.equal(run.status, "NOT_RUN");
    assert.equal(run.sessionStarted, false);
  }
});

test("CF-041 release build retains every host manifest without changing its bytes", async () => {
  for (const relativePath of Object.values(manifests)) {
    const source = await readFile(path.resolve(relativePath));
    const packaged = await readFile(path.resolve("dist", relativePath));
    assert.deepEqual(packaged, source);
  }
});

test("CF-041 records source-skill host sessions without claiming plugin installation", async () => {
  const evidence = JSON.parse(await readFile(
    path.resolve("docs/verification/host-source-session.json"),
    "utf8"
  ));

  assert.equal(evidence.schemaVersion, 1);
  assert.match(evidence.sourceCommit, /^[a-f0-9]{40}$/u);
  assert.match(evidence.skillSha256, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.secretsInRecord, false);
  assert.equal(evidence.accountIdentifiersStored, false);

  assert.deepEqual(evidence.hosts.zcode, {
    status: "SOURCE_SKILL_SESSION_PASSED",
    runtimeVersion: "0.16.9",
    pluginInstalled: false,
    sessionStarted: true,
    hostModelCalls: 1,
    businessRemoteCalls: 0,
    writes: 0,
    result: {
      host: "zcode",
      skill: "content-harness",
      mode: "format",
      stages: ["format", "review"],
      missingInputs: ["content revision/reference"],
      assumptions: [],
      remoteCalls: []
    }
  });
  assert.deepEqual(evidence.hosts.kimi, {
    status: "BLOCKED_HOST_QUOTA",
    runtimeVersion: "0.43.1",
    pluginInstalled: false,
    sessionStarted: true,
    hostModelAttempts: 1,
    httpStatus: 403,
    modelResponseRecorded: false,
    businessRemoteCalls: 0,
    writes: 0
  });
  assert.deepEqual(evidence.hosts.codex, {
    status: "SOURCE_SKILL_SESSION_PASSED",
    runtimeVersion: "0.153.4",
    pluginInstalled: false,
    sessionStarted: true,
    hostModelCalls: 1,
    businessRemoteCalls: 0,
    writes: 0,
    skillDiscoveryWarning:
      "context-budget-descriptions-removed-explicit-source-read-succeeded",
    result: {
      host: "codex",
      skill: "content-harness",
      mode: "format",
      stages: ["format", "review"],
      missingInputs: ["文章正文或内容修订引用", "明确的目标内容平台"],
      assumptions: [],
      remoteCalls: []
    }
  });
});
