import assert from "node:assert/strict";
import test from "node:test";

import {
  createClaimRegistry,
  createSourceBundle
} from "../packages/core/src/content/claims.ts";
import { buildResearchContext } from "../adapters/content-methods/research.ts";

const external = (id, overrides = {}) => ({
  sourceId: id,
  origin: "external",
  accessStatus: "read",
  locator: { kind: "url", value: `https://example.com/${id}` },
  sourcePermission: "read",
  deliveryExcerptAllowed: false,
  ...overrides
});

test("CF-015 rejects a verifiable claim that cites a source which was not actually read", () => {
  const sources = createSourceBundle([
    external("s1", { accessStatus: "unread" })
  ]);

  assert.throws(
    () => createClaimRegistry({
      sourceBundle: sources,
      searchAvailable: false,
      claims: [{
        claimId: "c1",
        statement: "Revenue grew 20%.",
        kind: "verifiable",
        evidence: [{ sourceId: "s1", locator: "paragraph:4" }]
      }]
    }),
    error => error?.code === "CLAIM_SOURCE_UNREAD"
  );
});

test("CF-015 preserves conflicting evidence instead of picking the favorable value", () => {
  const sources = createSourceBundle([external("s1"), external("s2")]);
  const registry = createClaimRegistry({
    sourceBundle: sources,
    searchAvailable: true,
    claims: [
      {
        claimId: "c1",
        statement: "The metric is 10%.",
        kind: "verifiable",
        conflictGroup: "metric-x",
        evidence: [{ sourceId: "s1", locator: "table:1" }]
      },
      {
        claimId: "c2",
        statement: "The metric is 14%.",
        kind: "verifiable",
        conflictGroup: "metric-x",
        evidence: [{ sourceId: "s2", locator: "paragraph:2" }]
      }
    ]
  });

  assert.equal(registry.claims.length, 2);
  assert.deepEqual(registry.conflicts, [{
    conflictGroup: "metric-x",
    claimIds: ["c1", "c2"]
  }]);
  assert.equal(registry.claims.every(claim => claim.verification === "source-backed"), true);
});

test("CF-015 user-provided assertions are never mislabeled as independently public-verified", () => {
  const sources = createSourceBundle([{
    sourceId: "user-note",
    origin: "user",
    accessStatus: "read",
    locator: { kind: "user-material", value: "brief:1" },
    sourcePermission: "provided",
    deliveryExcerptAllowed: true
  }]);

  const registry = createClaimRegistry({
    sourceBundle: sources,
    searchAvailable: false,
    claims: [{
      claimId: "c-user",
      statement: "Our internal pilot served 37 schools.",
      kind: "user_assertion",
      evidence: [{ sourceId: "user-note", locator: "brief:1" }]
    }]
  });

  assert.equal(registry.claims[0].verification, "user-asserted");
  assert.equal(registry.claims[0].independentlyPublicVerified, false);
});

test("CF-015 materials-only mode is explicit and source permission is separate from excerpt permission", () => {
  const sourceBundle = createSourceBundle([
    external("s1", {
      sourcePermission: "licensed-read",
      deliveryExcerptAllowed: false
    })
  ]);
  const research = buildResearchContext({
    sourceBundle,
    searchAvailable: false
  });

  assert.equal(research.mode, "materials-only");
  assert.equal(research.sources[0].sourcePermission, "licensed-read");
  assert.equal(research.sources[0].deliveryExcerptAllowed, false);
});
