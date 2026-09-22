import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CF-003 and CF-035 record real external validation blockers without provider identities", async () => {
  const raw = await readFile(
    new URL("../../docs/verification/external-validation-boundaries.json", import.meta.url),
    "utf8"
  );
  const evidence = JSON.parse(raw);
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.aiContentDetectionPlatform.apiCredentialPresent, false);
  assert.equal(evidence.aiContentDetectionPlatform.status, "BLOCKED_CREDENTIAL_AND_QUOTA");
  assert.equal(evidence.contentPlatformAccount.apiCredentialPresent, false);
  assert.equal(evidence.contentPlatformAccount.browserStatus, "BLOCKED_SITE_SAFETY_POLICY");
  assert.equal(evidence.contentPlatformAccount.draftCreated, false);
  assert.equal(evidence.contentPlatformAccount.publicationAttempted, false);
  assert.equal(evidence.secretsInRecord, false);
  assert.equal(evidence.accountIdentifiersStored, false);
  assert.doesNotMatch(raw, /Zhuque|Tencent|WeChat|微信|朱雀/u);
});
