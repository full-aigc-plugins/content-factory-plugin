#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--json" || current === "--summary") {
      values.set(current.slice(2), "true");
      continue;
    }
    if (!current.startsWith("--")) continue;
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) continue;
    values.set(current.slice(2), next);
    index += 1;
  }
  return Object.fromEntries(values);
}

function acceptanceError(code, message, details = undefined) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function verifyCandidate(
  candidateRoot,
  expectedVersion,
  expectedSourceCommit,
  explicitManifestPath = undefined
) {
  const manifestPath = explicitManifestPath === undefined
    ? path.join(candidateRoot, "build-manifest.json")
    : path.resolve(explicitManifestPath);
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const packageJson = await readJson(path.join(candidateRoot, "package.json"));
  if (packageJson.version !== expectedVersion) {
    throw acceptanceError("CANDIDATE_VERSION_MISMATCH", "candidate version does not match", {
      expected: expectedVersion,
      actual: packageJson.version
    });
  }
  if (manifest.sourceCommit !== expectedSourceCommit) {
    throw acceptanceError(
      "CANDIDATE_SOURCE_COMMIT_MISMATCH",
      "candidate source commit does not match",
      { expected: expectedSourceCommit, actual: manifest.sourceCommit }
    );
  }
  const badFiles = [];
  for (const file of manifest.files) {
    try {
      const bytes = await readFile(path.join(candidateRoot, file.path));
      if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) badFiles.push(file.path);
    } catch {
      badFiles.push(file.path);
    }
  }
  if (badFiles.length > 0) {
    throw acceptanceError("CANDIDATE_INTEGRITY_MISMATCH", "candidate files failed integrity", {
      badFiles
    });
  }
  return {
    version: packageJson.version,
    sourceCommit: manifest.sourceCommit,
    manifestSha256: sha256(manifestBytes),
    manifestFiles: manifest.files.length,
    manifestBinding: explicitManifestPath === undefined ? "candidate-root" : "external-package-manifest"
  };
}

async function loadCandidateModules(candidateRoot) {
  const moduleUrl = relative => pathToFileURL(path.join(candidateRoot, relative)).href;
  const [registry, nativeWriting, authorProfile, claims, delivery, deliveryManifest] =
    await Promise.all([
      import(moduleUrl("packages/core/src/channels/registry.ts")),
      import(moduleUrl("packages/core/src/channels/native-writing.ts")),
      import(moduleUrl("packages/core/src/content/author-profile.ts")),
      import(moduleUrl("packages/core/src/content/claims.ts")),
      import(moduleUrl("packages/core/src/delivery/export.ts")),
      import(moduleUrl("packages/core/src/delivery/manifest.ts"))
    ]);
  return { registry, nativeWriting, authorProfile, claims, delivery, deliveryManifest };
}

async function verifyVendorContract(candidateRoot) {
  const lockBytes = await readFile(path.join(candidateRoot, "skills.lock.json"));
  const lock = JSON.parse(lockBytes.toString("utf8"));
  const localBytes = await readFile(path.join(candidateRoot, "plugin-local-skills.json"));
  const local = JSON.parse(localBytes.toString("utf8"));
  const declared = lock.sources.flatMap(source => source.skills);
  const localNames = Array.isArray(local.skills)
    ? local.skills.map(item => typeof item === "string" ? item : item.name)
    : [];
  const skillNames = [...declared, ...localNames];
  if (!skillNames.includes("content-harness")) {
    throw acceptanceError("CONTENT_HARNESS_NOT_DECLARED", "content-harness is not declared");
  }
  for (const skillName of skillNames) {
    await readFile(path.join(candidateRoot, "skills", skillName, "SKILL.md"));
  }
  for (const source of lock.sources) {
    if (!/^v\d+\.\d+\.\d+$/u.test(source.ref)
        || !/^[a-f0-9]{40}$/u.test(source.sha)
        || source.license?.spdx !== "MIT") {
      throw acceptanceError("VENDOR_CONTRACT_INVALID", "vendor lock is not immutable", {
        package: source.package
      });
    }
    for (const skillName of source.skills) {
      if (!/^[a-f0-9]{64}$/u.test(source.sha256?.[skillName] ?? "")) {
        throw acceptanceError("VENDOR_CONTRACT_INVALID", "vendor skill digest is invalid", {
          package: source.package,
          skillName
        });
      }
    }
  }
  return {
    skillCount: skillNames.length,
    fingerprint: sha256(Buffer.concat([lockBytes, localBytes]))
  };
}

export async function runHostRecipeAcceptance(input) {
  if (!["codex", "zcode", "kimi"].includes(input.hostId)) {
    throw acceptanceError("HOST_UNSUPPORTED", "host must be codex, zcode, or kimi");
  }
  const candidateRoot = path.resolve(input.candidateRoot);
  const fixturePath = path.resolve(input.fixturePath);
  const candidate = await verifyCandidate(
    candidateRoot,
    input.expectedVersion,
    input.expectedSourceCommit,
    input.manifestPath
  );
  const vendorContract = await verifyVendorContract(candidateRoot);
  const fixtureBytes = await readFile(fixturePath);
  const fixture = JSON.parse(fixtureBytes.toString("utf8"));
  const modules = await loadCandidateModules(candidateRoot);
  const registry = await modules.registry.loadChannelRegistry();
  const registryErrors = modules.registry.validateChannelRegistry(registry).errors;
  if (registryErrors.length > 0) {
    throw acceptanceError("CHANNEL_REGISTRY_INVALID", "channel registry is invalid", {
      errors: registryErrors
    });
  }
  if (fixture.examples.length !== registry.recipes.length) {
    throw acceptanceError("FIXTURE_RECIPE_COUNT_MISMATCH", "fixture does not cover every recipe");
  }

  const sourceBundle = modules.claims.createSourceBundle([{
    sourceId: "host-acceptance-fact-pack",
    origin: "user",
    accessStatus: "read",
    locator: { kind: "fixture", value: "shared-authorized-fact-pack-v1" },
    sourcePermission: "project-owned-test-evidence",
    deliveryExcerptAllowed: true
  }]);
  const claimStatement = "Content Factory evaluates 39 channel-format recipes.";
  const claimRegistry = modules.claims.createClaimRegistry({
    sourceBundle,
    searchAvailable: false,
    claims: [{
      claimId: "claim-recipe-count",
      statement: claimStatement,
      kind: "verifiable",
      evidence: [{
        sourceId: "host-acceptance-fact-pack",
        locator: "catalog:39-recipes"
      }]
    }]
  });
  const profile = modules.authorProfile.createAuthorProfile({
    profileId: "host-acceptance-author",
    sampleTexts: [],
    protectedTerms: ["Content Factory"],
    blockedPhrases: ["guaranteed viral growth"]
  });
  const restrictedContext = {
    privateAuthorFacts: [],
    sourceAnecdotes: [],
    unsupportedVendorClaims: ["guaranteed viral growth"]
  };
  const exportRoot = await mkdtemp(path.join(os.tmpdir(), `content-factory-${input.hostId}-`));
  const receipts = [];
  let temporaryExportsRemoved = false;
  try {
    for (const recipe of registry.recipes) {
      const recipeKey = `${recipe.channelId}/${recipe.formatId}`;
      const example = fixture.examples.find(item => item.recipeKey === recipeKey);
      if (example === undefined || !recipe.stages.includes(example.requiredStage)) {
        throw acceptanceError("RECIPE_FIXTURE_INVALID", "recipe fixture is invalid", { recipeKey });
      }
      const resolved = modules.registry.resolveChannelRecipe(registry, {
        channelId: recipe.channelId,
        formatId: recipe.formatId,
        requestedAction: "draft"
      });
      if (resolved.status !== "resolved") {
        throw acceptanceError("PROFILE_RESOLUTION_FAILED", "profile resolution failed", {
          recipeKey,
          reason: resolved.reason
        });
      }
      const [request] = modules.nativeWriting.createNativeWritingRequests({
        sourceBundleId: "host-acceptance-fact-pack",
        claimRegistry,
        authorProfile: profile,
        registry,
        targets: [{
          channelId: recipe.channelId,
          formatId: recipe.formatId,
          locale: example.locale
        }],
        restrictedContext
      });
      const text = `${claimStatement}\n\n${example.nativeSections.join(" | ")}`;
      const accepted = modules.nativeWriting.acceptNativeCandidate(request, {
        channelId: recipe.channelId,
        formatId: recipe.formatId,
        sections: [...request.outputContract.requiredSections],
        text,
        claimRenderings: [{ claimId: "claim-recipe-count", text: claimStatement }]
      }, restrictedContext);
      const destination = path.join(exportRoot, `${String(receipts.length + 1).padStart(2, "0")}-${recipe.channelId}-${recipe.formatId}`);
      const exported = await modules.delivery.exportDeliveryPackage({
        allowedRoot: exportRoot,
        destination,
        kind: "working",
        variant: {
          variantId: accepted.variantId,
          packageStatus: "working",
          markdown: `# ${recipeKey}\n\n${accepted.text}`,
          html: `<h1>${recipeKey}</h1><p>${accepted.text.replaceAll("\n", "<br>")}</p>`,
          contentPlatformHtml: `<h1>${recipeKey}</h1><p>${accepted.text.replaceAll("\n", "<br>")}</p>`
        },
        readiness: {
          visuals: "not-required",
          detection: "missing",
          delivery: "not-required"
        },
        missingRequirements: ["editorial-approval"],
        assets: [],
        sources: [{
          sourceId: "host-acceptance-fact-pack",
          label: "project-owned acceptance fact pack",
          visibility: "public"
        }],
        reports: [],
        receipt: null,
        includeInternalAudit: false
      });
      const verified = await modules.deliveryManifest.verifyExportManifest(destination);
      if (!verified.valid) {
        throw acceptanceError("WORKING_EXPORT_INVALID", "working export verification failed", {
          recipeKey,
          mismatches: verified.mismatches
        });
      }
      receipts.push({
        recipeKey,
        locale: example.locale,
        profileRef: request.profileRef,
        recipeRef: request.recipeRef,
        requiredCapabilities: {
          profileResolution: "VERIFIED",
          vendorContract: "VERIFIED",
          authoring: "VERIFIED",
          workingExport: "VERIFIED"
        },
        authoringFingerprint: accepted.fingerprint,
        exportManifestSha256: exported.manifest.packageHash
      });
    }
  } finally {
    await rm(exportRoot, { recursive: true, force: true });
    temporaryExportsRemoved = true;
  }

  return {
    schemaVersion: 1,
    status: "VERIFIED_HOST_RECIPES",
    recordedAt: new Date().toISOString(),
    host: { id: input.hostId, version: input.hostVersion },
    sessionId: input.sessionId,
    candidate,
    fixture: {
      sha256: sha256(fixtureBytes),
      pathAlias: "tests/fixtures/channel-writing/catalog-examples.json"
    },
    vendorContract,
    recipeCount: receipts.length,
    evaluatedCombinationCount: receipts.length,
    requiredCapabilityCount: receipts.length * 4,
    verifiedRequiredCapabilityCount: receipts.length * 4,
    failedRequiredCapabilityCount: 0,
    notRunRequiredCapabilityCount: 0,
    remoteCalls: 0,
    accountAccess: "NOT_RUN",
    temporaryExportsRemoved,
    recipeEvidenceSha256: sha256(JSON.stringify(receipts)),
    recipes: receipts,
    secretsInRecord: false,
    accountIdentifiersStored: false
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["installed-host"]) {
    const hostId = args["installed-host"];
    const hostKey = hostId.toUpperCase();
    const release = await readJson(path.resolve("docs/verification/release-candidate.json"));
    const defaultRoots = {
      codex: path.join(
        os.homedir(),
        ".codex/plugins/cache/personal/content-factory",
        release.currentVersion
      ),
      zcode: path.join(
        os.homedir(),
        ".zcode/cli/plugins/cache/content-factory-candidate/content-factory",
        release.currentVersion
      ),
      kimi: path.join(os.homedir(), ".kimi-code/plugins/managed/content-factory")
    };
    const defaultVersions = { codex: "0.153.4", zcode: "0.16.9", kimi: "0.43.1" };
    if (!Object.hasOwn(defaultRoots, hostId)) {
      throw acceptanceError("HOST_UNSUPPORTED", "installed host is unsupported", { hostId });
    }
    const candidateRoot = process.env[`CONTENT_FACTORY_ACCEPTANCE_${hostKey}_ROOT`]
      ?? defaultRoots[hostId];
    const manifestPath = process.env.CONTENT_FACTORY_ACCEPTANCE_MANIFEST
      ?? path.join(defaultRoots.codex, "build-manifest.json");
    args.host = hostId;
    args["host-version"] = process.env[`CONTENT_FACTORY_ACCEPTANCE_${hostKey}_VERSION`]
      ?? defaultVersions[hostId];
    args["candidate-root"] = candidateRoot;
    args.manifest = manifestPath;
    args["expected-version"] = process.env.CONTENT_FACTORY_ACCEPTANCE_VERSION
      ?? release.currentVersion;
    args["expected-source-commit"] = process.env.CONTENT_FACTORY_ACCEPTANCE_SOURCE_COMMIT
      ?? release.manifestSourceCommit;
    args.fixture = path.resolve("tests/fixtures/channel-writing/catalog-examples.json");
  }
  const required = [
    "host",
    "host-version",
    "candidate-root",
    "expected-version",
    "expected-source-commit",
    "fixture"
  ];
  const missing = required.filter(key => !args[key]);
  if (missing.length > 0) {
    throw acceptanceError("ARGUMENT_REQUIRED", "required arguments are missing", { missing });
  }
  const report = await runHostRecipeAcceptance({
    hostId: args.host,
    hostVersion: args["host-version"],
    candidateRoot: args["candidate-root"],
    expectedVersion: args["expected-version"],
    expectedSourceCommit: args["expected-source-commit"],
    manifestPath: args.manifest,
    fixturePath: args.fixture,
    sessionId: args["session-id"] ?? "unrecorded"
  });
  if (args.summary === "true") {
    const { recipes: _recipes, ...summary } = report;
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({
      error: {
        code: error.code ?? "HOST_RECIPE_ACCEPTANCE_FAILED",
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details })
      }
    })}\n`);
    process.exitCode = 2;
  });
}
