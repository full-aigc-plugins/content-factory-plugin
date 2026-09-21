import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAuthorProfile } from "../packages/core/src/content/author-profile.ts";
import {
  acceptNativeCandidate,
  createNativeWritingRequests
} from "../packages/core/src/channels/native-writing.ts";
import { loadChannelRegistry } from "../packages/core/src/channels/registry.ts";

const fixture = JSON.parse(await readFile(
  new URL("../tests/fixtures/channel-writing/shared-source-three-native-variants.json", import.meta.url),
  "utf8"
));

const claimRegistry = {
  mode: "materials-only",
  conflicts: [],
  claims: fixture.claims
};

const authorProfile = createAuthorProfile({
  profileId: "author_cf050",
  sampleTexts: ["Clear evidence first. Keep the operational boundary explicit."],
  privateFacts: fixture.restrictedContext.privateAuthorFacts,
  protectedTerms: ["Content Factory", "ms"],
  blockedPhrases: ["guaranteed viral"]
});

test("CF-050 builds three independent native sibling requests from the same claims", async () => {
  const requests = createNativeWritingRequests({
    sourceBundleId: fixture.sourceBundleId,
    claimRegistry,
    authorProfile,
    registry: await loadChannelRegistry(),
    targets: fixture.targets,
    restrictedContext: fixture.restrictedContext
  });

  assert.equal(requests.length, 3);
  assert.equal(new Set(requests.map(item => item.lineage.siblingGroupId)).size, 1);
  assert.deepEqual(
    requests.map(item => item.lineage.sourceBundleId),
    [fixture.sourceBundleId, fixture.sourceBundleId, fixture.sourceBundleId]
  );
  assert.equal(new Set(requests.map(item => item.variantId)).size, 3);
  assert.equal(requests.every(item => !("parentVariantId" in item.lineage)), true);
  assert.deepEqual(requests.map(item => item.outputContract.requiredSections), [
    ["title", "lead", "sections", "sources"],
    ["hook", "body", "takeaways", "tags"],
    ["hook", "spoken-beats", "subtitle-cues", "closing"]
  ]);
  assert.equal(new Set(requests.map(item => item.outputContract.id)).size, 3);
  assert.deepEqual(requests.map(item => item.recipeRef), [
    "wechat-article/article@1",
    "xiaohongshu/note@1",
    "douyin/short_video_script@1"
  ]);
});

test("CF-050 excludes private anecdotes and unsupported algorithm claims from vendor requests", async () => {
  const requests = createNativeWritingRequests({
    sourceBundleId: fixture.sourceBundleId,
    claimRegistry,
    authorProfile,
    registry: await loadChannelRegistry(),
    targets: fixture.targets,
    restrictedContext: fixture.restrictedContext
  });
  const serialized = JSON.stringify(requests);
  for (const restricted of Object.values(fixture.restrictedContext).flat()) {
    assert.equal(serialized.includes(restricted), false, restricted);
  }
  assert.equal(requests.every(item => item.exclusionPolicy.privateAuthorFacts === "omit"), true);
  assert.equal(requests.every(item => item.exclusionPolicy.sourceAnecdotes === "omit-unless-authorized"), true);
  assert.equal(requests.every(item => item.exclusionPolicy.unsupportedVendorClaims === "omit"), true);
});

test("CF-050 accepts distinct native candidates while preserving shared claims and terminology", async () => {
  const requests = createNativeWritingRequests({
    sourceBundleId: fixture.sourceBundleId,
    claimRegistry,
    authorProfile,
    registry: await loadChannelRegistry(),
    targets: fixture.targets,
    restrictedContext: fixture.restrictedContext
  });
  const results = requests.map(request => {
    const candidate = fixture.candidates.find(item =>
      item.channelId === request.target.channelId && item.formatId === request.target.formatId
    );
    return acceptNativeCandidate(request, candidate, fixture.restrictedContext);
  });

  assert.deepEqual(results.map(item => item.status), [
    "review-required",
    "review-required",
    "review-required"
  ]);
  assert.equal(new Set(results.map(item => item.fingerprint)).size, 3);
  assert.equal(results.every(item => item.claimIds.join(",") === "claim_runtime,claim_delivery"), true);
});

test("CF-050 blocks copied anecdotes, unsupported multipliers, and changed protected facts", async () => {
  const [request] = createNativeWritingRequests({
    sourceBundleId: fixture.sourceBundleId,
    claimRegistry,
    authorProfile,
    registry: await loadChannelRegistry(),
    targets: [fixture.targets[0]],
    restrictedContext: fixture.restrictedContext
  });
  const base = fixture.candidates[0];

  for (const restricted of Object.values(fixture.restrictedContext).flat()) {
    assert.throws(
      () => acceptNativeCandidate(request, {
        ...base,
        text: `${base.text}\n\n${restricted}`
      }, fixture.restrictedContext),
      error => error?.code === "NATIVE_RESTRICTED_CONTEXT"
    );
  }

  assert.throws(
    () => acceptNativeCandidate(request, {
      ...base,
      text: base.text.replace("16 channel profiles", "60 channel profiles"),
      claimRenderings: base.claimRenderings.map(item => item.claimId === "claim_runtime"
        ? { ...item, text: item.text.replace("16 channel profiles", "60 channel profiles") }
        : item)
    }, fixture.restrictedContext),
    error => error?.code === "NATIVE_PROTECTED_FACT_CHANGED"
  );

  assert.throws(
    () => acceptNativeCandidate(request, {
      ...base,
      text: base.text.replace("120 ms", "120 milliseconds"),
      claimRenderings: base.claimRenderings.map(item => item.claimId === "claim_runtime"
        ? { ...item, text: item.text.replace("120 ms", "120 milliseconds") }
        : item)
    }, fixture.restrictedContext),
    error => error?.code === "NATIVE_PROTECTED_FACT_CHANGED"
  );
});
