import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadChannelRegistry } from "../../packages/core/src/channels/registry.ts";

type LiveIndex = {
  schemaVersion: number;
  status: "NOT_RUN";
  releaseCandidate: {
    selected: boolean;
    packageVersion: string;
    commit: string | null;
  };
  hosts: string[];
  recipes: string[];
  accountClasses: string[];
  dimensions: Array<{
    id: string;
    status: "NOT_RUN";
    evidenceRefs: string[];
  }>;
  expectedCombinationCount: number;
  liveCombinationCount: number;
};

async function readIndex(): Promise<LiveIndex> {
  return JSON.parse(await readFile(
    new URL("../../docs/verification/channel-live-index.json", import.meta.url),
    "utf8"
  )) as LiveIndex;
}

test("CF-057 indexes every declared host and channel recipe without inventing an account", async () => {
  const index = await readIndex();
  const registry = await loadChannelRegistry();
  assert.deepEqual(index.hosts, ["codex", "zcode", "kimi"]);
  assert.deepEqual(index.recipes, registry.recipes.map(item => `${item.channelId}/${item.formatId}`));
  assert.deepEqual(index.accountClasses, ["authorized-external-account"]);
  assert.equal(index.expectedCombinationCount, 3 * 39);
});

test("CF-057 separates every required live operation dimension", async () => {
  const index = await readIndex();
  assert.deepEqual(index.dimensions.map(item => item.id), [
    "profile-resolution",
    "vendor-contract",
    "authoring",
    "working-export",
    "authorized-source-read",
    "draft-save",
    "draft-readback",
    "public-publish",
    "feedback-read",
    "reply-draft"
  ]);
});

test("CF-057 keeps skipped actual hosts, channels, and accounts strictly NOT_RUN", async () => {
  const index = await readIndex();
  assert.equal(index.status, "NOT_RUN");
  assert.deepEqual(index.releaseCandidate, {
    selected: false,
    packageVersion: "0.1.0",
    commit: null
  });
  assert.equal(index.liveCombinationCount, 0);
  assert.equal(index.dimensions.every(item => item.status === "NOT_RUN"), true);
  assert.equal(index.dimensions.every(item => item.evidenceRefs.length === 0), true);
  assert.equal(JSON.stringify(index).includes("VERIFIED"), false);
});

test("CF-057 human-readable matrix states that offline contracts are not live proof", async () => {
  const matrix = await readFile(
    new URL("../../docs/verification/channel-host-matrix.md", import.meta.url),
    "utf8"
  );
  assert.equal(matrix.includes("Offline contract tests are not live host evidence"), true);
  assert.equal(matrix.includes("117 expected host × recipe combinations: NOT_RUN"), true);
  assert.equal(matrix.includes("Public publishing is outside the V1 release promise"), true);
});
