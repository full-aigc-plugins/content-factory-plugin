import { createHash, randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  rm,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";

import { ContentFactoryError } from "../errors.ts";
import {
  createExportManifest,
  isSafeExportRelativePath,
  type ExportManifest
} from "./manifest.ts";

type ExportReadiness = {
  visuals: "ready" | "missing" | "not-required";
  detection: "passed" | "missing" | "not-required";
  delivery: "verified" | "conflict" | "unknown" | "not-required";
};

export type DeliveryExportInput = {
  allowedRoot: string;
  destination: string;
  kind: "working" | "verified";
  variant: {
    variantId: string;
    packageStatus: "working" | "verified";
    markdown: string;
    html: string;
    contentPlatformHtml: string;
  };
  readiness: ExportReadiness;
  missingRequirements: string[];
  assets: Array<{
    fileName: string;
    bytes: Buffer;
    sha256: string;
    visibility: "public" | "private";
  }>;
  sources: Array<{
    sourceId: string;
    label: string;
    visibility: "public" | "private";
  }>;
  reports: Array<{
    fileName: string;
    content: string;
    visibility: "public" | "internal";
  }>;
  receipt: Record<string, unknown> | null;
  includeInternalAudit: boolean;
};

function exportError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ContentFactoryError {
  return new ContentFactoryError({
    code,
    message,
    retryable: false,
    ...(details ? { details } : {})
  });
}

function collectMissingRequirements(input: DeliveryExportInput): string[] {
  const missing = new Set(input.missingRequirements);
  if (input.variant.packageStatus !== "verified") missing.add("package-status");
  if (input.readiness.visuals === "missing") missing.add("visuals");
  if (input.readiness.detection === "missing") missing.add("detection");
  if (input.readiness.delivery === "conflict"
      || input.readiness.delivery === "unknown") {
    missing.add("delivery-verification");
  }
  return [...missing].sort();
}

function requireSafeChildName(value: string): void {
  if (!isSafeExportRelativePath(value)
      || value.includes("/")
      || value.includes("\\")) {
    throw exportError(
      "DELIVERY_EXPORT_UNSAFE_PATH",
      "export child names must be single safe path segments"
    );
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === ""
    || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function nearestExistingAncestor(target: string): Promise<string> {
  let current = target;
  while (true) {
    try {
      await lstat(current);
      return current;
    } catch (caught) {
      const error = caught as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") throw caught;
      const parent = path.dirname(current);
      if (parent === current) throw caught;
      current = parent;
    }
  }
}

async function assertAuthorizedDestination(
  allowedRoot: string,
  destination: string
): Promise<{ root: string; destination: string }> {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedDestination = path.resolve(destination);
  if (!isInside(resolvedRoot, resolvedDestination)) {
    throw exportError(
      "DELIVERY_EXPORT_PATH_ESCAPE",
      "export destination is outside the authorized root"
    );
  }
  let realRoot: string;
  try {
    realRoot = await realpath(resolvedRoot);
  } catch {
    throw exportError(
      "DELIVERY_EXPORT_ROOT_INVALID",
      "authorized export root must already exist"
    );
  }
  const ancestor = await nearestExistingAncestor(path.dirname(resolvedDestination));
  const realAncestor = await realpath(ancestor);
  if (!isInside(realRoot, realAncestor)) {
    throw exportError(
      "DELIVERY_EXPORT_PATH_ESCAPE",
      "export destination resolves outside the authorized root"
    );
  }
  return { root: realRoot, destination: resolvedDestination };
}

async function writePayload(root: string, relative: string, bytes: Buffer): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
}

export async function exportDeliveryPackage(input: DeliveryExportInput): Promise<{
  status: "exported";
  destination: string;
  manifest: ExportManifest;
}> {
  for (const asset of input.assets) {
    requireSafeChildName(asset.fileName);
    if (sha256(asset.bytes) !== asset.sha256) {
      throw exportError(
        "DELIVERY_EXPORT_ASSET_HASH_MISMATCH",
        "asset bytes do not match the declared digest",
        { fileName: asset.fileName }
      );
    }
  }
  for (const report of input.reports) requireSafeChildName(report.fileName);

  const missing = collectMissingRequirements(input);
  if (input.kind === "verified" && missing.length > 0) {
    throw exportError(
      "DELIVERY_EXPORT_NOT_VERIFIED",
      "verified export requirements are not satisfied",
      { missingRequirements: missing }
    );
  }

  const authorized = await assertAuthorizedDestination(
    input.allowedRoot,
    input.destination
  );
  const destination = authorized.destination;
  if (path.dirname(destination) === destination) {
    throw exportError(
      "DELIVERY_EXPORT_UNSAFE_PATH",
      "filesystem root is not an export destination"
    );
  }
  if (await exists(destination)) {
    throw exportError(
      "DELIVERY_EXPORT_DESTINATION_EXISTS",
      "export destination already exists"
    );
  }

  const payloads = new Map<string, Buffer>();
  payloads.set("public/content.md", Buffer.from(input.variant.markdown, "utf8"));
  payloads.set("public/content.html", Buffer.from(input.variant.html, "utf8"));
  payloads.set(
    "public/content-platform.html",
    Buffer.from(input.variant.contentPlatformHtml, "utf8")
  );
  for (const asset of input.assets) {
    if (asset.visibility === "public") {
      payloads.set(`public/assets/${asset.fileName}`, Buffer.from(asset.bytes));
    } else if (input.includeInternalAudit) {
      payloads.set(`audit/assets/${asset.fileName}`, Buffer.from(asset.bytes));
    }
  }
  for (const report of input.reports) {
    if (report.visibility === "public") {
      payloads.set(
        `public/reports/${report.fileName}`,
        Buffer.from(report.content, "utf8")
      );
    } else if (input.includeInternalAudit) {
      payloads.set(
        `audit/reports/${report.fileName}`,
        Buffer.from(report.content, "utf8")
      );
    }
  }
  if (input.includeInternalAudit) {
    const privateSources = input.sources.filter(source => source.visibility === "private");
    if (privateSources.length > 0) {
      payloads.set(
        "audit/sources.json",
        Buffer.from(`${JSON.stringify(privateSources, null, 2)}\n`, "utf8")
      );
    }
    if (input.receipt !== null) {
      payloads.set(
        "audit/receipt.json",
        Buffer.from(`${JSON.stringify(input.receipt, null, 2)}\n`, "utf8")
      );
    }
  }

  const manifest = createExportManifest({
    exportKind: input.kind,
    variantId: input.variant.variantId,
    packageStatus: input.variant.packageStatus,
    missingRequirements: input.kind === "verified" ? [] : missing,
    sources: input.sources
      .filter(source => source.visibility === "public")
      .map(source => ({ ...source, visibility: "public" as const })),
    files: [...payloads].map(([relative, bytes]) => ({ path: relative, bytes }))
  });

  const parent = path.dirname(destination);
  const base = path.basename(destination);
  await mkdir(parent, { recursive: true });
  const realParent = await realpath(parent);
  if (!isInside(authorized.root, realParent)) {
    throw exportError(
      "DELIVERY_EXPORT_PATH_ESCAPE",
      "created export parent resolves outside the authorized root"
    );
  }
  const temporary = path.join(parent, `.${base}.tmp-${randomUUID()}`);
  const lockPath = path.join(parent, `.${base}.export.lock`);
  let lock: Awaited<ReturnType<typeof open>>;
  try {
    lock = await open(lockPath, "wx", 0o600);
  } catch {
    throw exportError(
      "DELIVERY_EXPORT_DESTINATION_EXISTS",
      "export destination is already reserved"
    );
  }
  try {
    if (await exists(destination)) {
      throw exportError(
        "DELIVERY_EXPORT_DESTINATION_EXISTS",
        "export destination already exists"
      );
    }
    await mkdir(temporary, { recursive: false });
    for (const [relative, bytes] of payloads) {
      await writePayload(temporary, relative, bytes);
    }
    await writePayload(
      temporary,
      "manifest.json",
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8")
    );
    if (await exists(destination)) {
      throw exportError(
        "DELIVERY_EXPORT_DESTINATION_EXISTS",
        "export destination appeared during export"
      );
    }
    await rename(temporary, destination);
    return { status: "exported", destination, manifest };
  } finally {
    await rm(temporary, { recursive: true, force: true });
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
  }
}
