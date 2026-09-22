import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadChannelRegistry, resolveChannelRecipe } from "../../packages/core/src/channels/registry.ts";

type AcceptanceCase = {
  id: string;
  status: "VERIFIED_OFFLINE";
  evidenceFile: string;
  assertionFragment: string;
};

type PreservedGate = {
  gate: string;
  status: "VERIFIED_OFFLINE" | "NOT_RUN";
  evidenceFile: string;
  assertionFragment: string;
};

type AcceptanceManifest = {
  cases: AcceptanceCase[];
  preservedGates: PreservedGate[];
};

type NativeExample = {
  recipeKey: string;
  locale: string;
  requiredStage: string;
  nativeSections: string[];
};

type NativeExampleFixture = {
  defaults: {
    audience: string;
    goal: string;
    sourceRefs: string[];
    misroutingFormatId: string;
  };
  examples: NativeExample[];
};

async function readJson<T>(relativePath: string): Promise<T> {
  const raw = await readFile(new URL(`../fixtures/channel-writing/${relativePath}`, import.meta.url), "utf8");
  return JSON.parse(raw) as T;
}

test("CF-056 maps every R01-R42 case to an executable offline assertion", async () => {
  const manifest = await readJson<AcceptanceManifest>("acceptance-cases.json");
  const expectedIds = Array.from({ length: 42 }, (_, index) => `R${String(index + 1).padStart(2, "0")}`);
  assert.deepEqual(manifest.cases.map(item => item.id), expectedIds);
  for (const item of manifest.cases) {
    assert.equal(item.status, "VERIFIED_OFFLINE");
    const source = await readFile(new URL(`../../${item.evidenceFile}`, import.meta.url), "utf8");
    assert.equal(source.includes(item.assertionFragment), true, `${item.id}:${item.assertionFragment}`);
  }
});

test("CF-056 includes one source-grounded native and misrouting example per declared recipe", async () => {
  const registry = await loadChannelRegistry();
  const fixture = await readJson<NativeExampleFixture>("catalog-examples.json");
  const { examples } = fixture;
  assert.equal(examples.length, registry.recipes.length);
  assert.equal(new Set(examples.map(item => item.recipeKey)).size, registry.recipes.length);
  assert.equal(fixture.defaults.audience.length > 0, true);
  assert.equal(fixture.defaults.goal.length > 0, true);
  assert.equal(fixture.defaults.sourceRefs.length > 0, true);

  for (const recipe of registry.recipes) {
    const recipeKey = `${recipe.channelId}/${recipe.formatId}`;
    const example = examples.find(item => item.recipeKey === recipeKey);
    assert.notEqual(example, undefined, recipeKey);
    assert.equal(example!.locale.length > 0, true);
    assert.equal(recipe.stages.includes(example!.requiredStage), true, recipeKey);
    assert.equal(example!.nativeSections.length > 0, true);

    const misroute = resolveChannelRecipe(registry, {
      channelId: recipe.channelId,
      formatId: fixture.defaults.misroutingFormatId
    });
    assert.deepEqual(misroute, { status: "unsupported", reason: "format-not-registered" });
  }
});

test("CF-056 preserves the original factual, privacy, security, and 30-document gates", async () => {
  const manifest = await readJson<AcceptanceManifest>("acceptance-cases.json");
  assert.deepEqual(manifest.preservedGates.map(item => item.gate).sort(), [
    "30-document-dual-human-review",
    "factual-integrity",
    "privacy-and-permission",
    "security-regression"
  ]);
  for (const gate of manifest.preservedGates) {
    const source = await readFile(new URL(`../../${gate.evidenceFile}`, import.meta.url), "utf8");
    assert.equal(source.includes(gate.assertionFragment), true, gate.gate);
  }
  assert.equal(
    manifest.preservedGates.find(item => item.gate === "30-document-dual-human-review")?.status,
    "NOT_RUN"
  );
});

test("CF-056 never upgrades offline regression evidence into live channel support", async () => {
  const manifest = await readJson<AcceptanceManifest>("acceptance-cases.json");
  assert.equal(JSON.stringify(manifest).includes("VERIFIED_LIVE"), false);
  assert.equal(manifest.cases.every(item => item.status === "VERIFIED_OFFLINE"), true);
});
