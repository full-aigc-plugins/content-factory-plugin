import assert from "node:assert/strict";
import test from "node:test";

import { defineDeliveryAccount } from "../packages/core/src/delivery/accounts.ts";
import { preflightDeliveryAccount } from "../packages/core/src/delivery/preflight.ts";
import { LayeredSecretProvider } from "../packages/core/src/security/credentials.ts";

const account = defineDeliveryAccount({
  alias: "内容平台主账号",
  credentialRef: "OFFICIAL_CONTENT_DRAFT_PRIMARY",
  expectedRemoteAccountId: "remote-account-a",
  deliveryMethod: "api-draft"
});

test("CF-031 system credential source has priority over explicit environment fallback", async () => {
  const provider = new LayeredSecretProvider({
    system: { async resolve() { return "system-secret"; } },
    environment: { async resolve() { return "environment-secret"; } }
  });

  assert.deepEqual(await provider.resolve(account.credentialRef), {
    status: "resolved",
    source: "system",
    secret: "system-secret"
  });
});

test("CF-031 missing credentials block without probing or exposing a secret", async () => {
  let probes = 0;
  const result = await preflightDeliveryAccount({
    account,
    approvedAccountAlias: account.alias,
    requiredPermissions: ["draft-write", "draft-read"],
    credentialProvider: new LayeredSecretProvider({
      system: { async resolve() { return null; } },
      environment: { async resolve() { return null; } }
    }),
    async probe() {
      probes += 1;
      throw new Error("must not probe");
    }
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "credential-unavailable");
  assert.equal(probes, 0);
  assert.equal("secret" in result, false);
});

test("CF-031 selected account A resolving to account B is rejected before write", async () => {
  const result = await preflightDeliveryAccount({
    account,
    approvedAccountAlias: account.alias,
    requiredPermissions: ["draft-write", "draft-read"],
    credentialProvider: new LayeredSecretProvider({
      system: { async resolve() { return "secret-value"; } },
      environment: { async resolve() { return null; } }
    }),
    async probe(input) {
      assert.equal(input.secret, "secret-value");
      return {
        remoteAccountId: "remote-account-b",
        permissions: ["draft-write", "draft-read"]
      };
    }
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "remote-account-mismatch");
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});

test("CF-031 missing permission does not silently select another account or method", async () => {
  const result = await preflightDeliveryAccount({
    account,
    approvedAccountAlias: account.alias,
    requiredPermissions: ["draft-write", "draft-read"],
    credentialProvider: new LayeredSecretProvider({
      system: { async resolve() { return "secret-value"; } },
      environment: { async resolve() { return null; } }
    }),
    async probe() {
      return {
        remoteAccountId: "remote-account-a",
        permissions: ["draft-read"]
      };
    }
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "permission-missing");
  assert.deepEqual(result.missingPermissions, ["draft-write"]);
  assert.equal(result.deliveryMethod, "api-draft");
});

test("CF-031 changing the approved account alias requires fresh approval", async () => {
  let probes = 0;
  const result = await preflightDeliveryAccount({
    account,
    approvedAccountAlias: "另一个账号",
    requiredPermissions: ["draft-write"],
    credentialProvider: new LayeredSecretProvider({
      system: { async resolve() { return "secret-value"; } },
      environment: { async resolve() { return null; } }
    }),
    async probe() {
      probes += 1;
      throw new Error("must not probe after approval mismatch");
    }
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "account-approval-required");
  assert.equal(probes, 0);
});

test("CF-031 verified identity and permissions produce an executable preflight", async () => {
  const result = await preflightDeliveryAccount({
    account,
    approvedAccountAlias: account.alias,
    requiredPermissions: ["draft-write", "draft-read"],
    credentialProvider: new LayeredSecretProvider({
      system: { async resolve() { return "secret-value"; } },
      environment: { async resolve() { return null; } }
    }),
    async probe() {
      return {
        remoteAccountId: "remote-account-a",
        permissions: ["draft-read", "draft-write", "asset-upload"]
      };
    }
  });

  assert.equal(result.status, "ready");
  assert.equal(result.accountAlias, "内容平台主账号");
  assert.equal(result.deliveryMethod, "api-draft");
  assert.equal(result.credentialSource, "system");
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});
