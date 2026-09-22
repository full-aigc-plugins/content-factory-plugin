import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ExportManifestFile = {
  path: string;
  bytes: number;
  sha256: string;
};

export type ExportManifest = {
  schemaVersion: 1;
  exportKind: "working" | "verified";
  variantId: string;
  packageStatus: "working" | "verified";
  missingRequirements: string[];
  sources: Array<{
    sourceId: string;
    label: string;
    visibility: "public";
  }>;
  files: ExportManifestFile[];
  packageHash: string;
};

function hash(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isSafeExportRelativePath(value: string): boolean {
  if (value.length === 0 || value.includes("\0") || path.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  return normalized === value
    && normalized !== "."
    && normalized !== ".."
    && !normalized.startsWith("../");
}

function unsignedManifest(input: Omit<ExportManifest, "packageHash">) {
  return {
    schemaVersion: input.schemaVersion,
    exportKind: input.exportKind,
    variantId: input.variantId,
    packageStatus: input.packageStatus,
    missingRequirements: [...input.missingRequirements],
    sources: input.sources.map(source => ({ ...source })),
    files: input.files.map(file => ({ ...file }))
  };
}

export function createExportManifest(input: {
  exportKind: "working" | "verified";
  variantId: string;
  packageStatus: "working" | "verified";
  missingRequirements: string[];
  sources: ExportManifest["sources"];
  files: Array<{ path: string; bytes: Buffer }>;
}): ExportManifest {
  const files = input.files
    .map(file => ({
      path: file.path,
      bytes: file.bytes.length,
      sha256: hash(file.bytes)
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const base: Omit<ExportManifest, "packageHash"> = {
    schemaVersion: 1,
    exportKind: input.exportKind,
    variantId: input.variantId,
    packageStatus: input.packageStatus,
    missingRequirements: [...input.missingRequirements].sort(),
    sources: input.sources
      .map(source => ({ ...source }))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    files
  };
  return {
    ...base,
    packageHash: hash(JSON.stringify(unsignedManifest(base)))
  };
}

function parseManifest(value: unknown): ExportManifest {
  if (typeof value !== "object" || value === null) {
    throw new Error("export manifest is not an object");
  }
  const item = value as Record<string, unknown>;
  if (item.schemaVersion !== 1
      || (item.exportKind !== "working" && item.exportKind !== "verified")
      || typeof item.variantId !== "string"
      || (item.packageStatus !== "working" && item.packageStatus !== "verified")
      || !Array.isArray(item.missingRequirements)
      || !item.missingRequirements.every(entry => typeof entry === "string")
      || !Array.isArray(item.sources)
      || !Array.isArray(item.files)
      || typeof item.packageHash !== "string") {
    throw new Error("export manifest is missing required fields");
  }
  const sources = item.sources.map(value => {
    if (typeof value !== "object" || value === null) {
      throw new Error("export manifest source is invalid");
    }
    const source = value as Record<string, unknown>;
    if (typeof source.sourceId !== "string"
        || typeof source.label !== "string"
        || source.visibility !== "public") {
      throw new Error("export manifest source is invalid");
    }
    return {
      sourceId: source.sourceId,
      label: source.label,
      visibility: "public" as const
    };
  });
  const files = item.files.map(value => {
    if (typeof value !== "object" || value === null) {
      throw new Error("export manifest file is invalid");
    }
    const file = value as Record<string, unknown>;
    if (typeof file.path !== "string"
        || !isSafeExportRelativePath(file.path)
        || typeof file.bytes !== "number"
        || !Number.isSafeInteger(file.bytes)
        || file.bytes < 0
        || typeof file.sha256 !== "string"
        || !/^[0-9a-f]{64}$/u.test(file.sha256)) {
      throw new Error("export manifest file is invalid");
    }
    return { path: file.path, bytes: file.bytes, sha256: file.sha256 };
  });
  return {
    schemaVersion: 1,
    exportKind: item.exportKind,
    variantId: item.variantId,
    packageStatus: item.packageStatus,
    missingRequirements: [...item.missingRequirements] as string[],
    sources,
    files,
    packageHash: item.packageHash
  };
}

export async function loadExportManifest(root: string): Promise<ExportManifest> {
  const bytes = await readFile(path.join(path.resolve(root), "manifest.json"), "utf8");
  return parseManifest(JSON.parse(bytes));
}

export async function verifyExportManifest(root: string): Promise<{
  valid: boolean;
  mismatches: string[];
}> {
  const resolvedRoot = path.resolve(root);
  let manifest: ExportManifest;
  try {
    manifest = await loadExportManifest(resolvedRoot);
  } catch {
    return { valid: false, mismatches: ["manifest.json"] };
  }
  const mismatches: string[] = [];
  const base = unsignedManifest({
    schemaVersion: manifest.schemaVersion,
    exportKind: manifest.exportKind,
    variantId: manifest.variantId,
    packageStatus: manifest.packageStatus,
    missingRequirements: manifest.missingRequirements,
    sources: manifest.sources,
    files: manifest.files
  });
  if (hash(JSON.stringify(base)) !== manifest.packageHash) {
    mismatches.push("manifest.json");
  }
  for (const file of manifest.files) {
    try {
      const bytes = await readFile(path.join(resolvedRoot, file.path));
      if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) {
        mismatches.push(file.path);
      }
    } catch {
      mismatches.push(file.path);
    }
  }
  return {
    valid: mismatches.length === 0,
    mismatches: [...new Set(mismatches)].sort()
  };
}
