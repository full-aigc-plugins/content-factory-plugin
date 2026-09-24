import { randomBytes } from "node:crypto";
import type { Stats } from "node:fs";
import { open, chmod, lstat, mkdir, readFile, rename, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import type { SecretProvider } from "./client.ts";

export const AI_CONTENT_DETECTOR_CREDENTIAL_REF = "AI_CONTENT_DETECTOR_PRIMARY";
const ENV_NAME = "ZHUQUE_API_KEY";

type Environment = Record<string, string | undefined>;
type CredentialStatus = {
  configured: boolean;
  source: "environment" | "user-config" | null;
  apiVerified: false;
  detectionVerified: false;
};

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

function currentUid(): number | null {
  return typeof process.getuid === "function" ? process.getuid() : null;
}

function assertPrivateFile(info: Stats): void {
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error("Zhuque credential path is not a regular file");
  }
  const uid = currentUid();
  if (uid !== null && (info.uid !== uid || (info.mode & 0o077) !== 0)) {
    throw new Error("Zhuque credential file is not owner-only");
  }
}

export function defaultZhuqueConfigPath(input: {
  env?: Environment;
  platform?: NodeJS.Platform;
  home?: string;
} = {}): string {
  const env = input.env ?? process.env;
  const platform = input.platform ?? process.platform;
  const home = input.home ?? homedir();
  const pathForPlatform = platform === "win32" ? path.win32 : path.posix;
  const configuredRoot = platform === "win32" ? env.APPDATA : env.XDG_CONFIG_HOME;
  const root = configuredRoot && pathForPlatform.isAbsolute(configuredRoot)
    ? configuredRoot
    : platform === "win32"
      ? pathForPlatform.join(home, "AppData", "Roaming")
      : pathForPlatform.join(home, ".config");
  return pathForPlatform.join(root, "content-factory", "credentials.json");
}

function checkedKey(value: string): string {
  const key = value.trim();
  if (!key || key.length > 4096 || /\s/u.test(key)) {
    throw new Error("Zhuque API Key must be one non-empty token of at most 4096 characters");
  }
  return key;
}

export class ZhuqueCredentials implements SecretProvider {
  readonly #configPath: string;
  readonly #env: Environment;

  constructor(input: { configPath?: string; env?: Environment } = {}) {
    this.#env = input.env ?? process.env;
    this.#configPath = input.configPath ?? defaultZhuqueConfigPath({ env: this.#env });
  }

  async #stored(): Promise<string | null> {
    let info;
    try {
      info = await lstat(this.#configPath);
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
    assertPrivateFile(info);
    let payload: unknown;
    try {
      payload = JSON.parse(await readFile(this.#configPath, "utf8"));
    } catch {
      throw new Error("Zhuque credential file could not be read");
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      throw new Error("Zhuque credential file has an invalid format");
    }
    const value = (payload as Record<string, unknown>)[ENV_NAME];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  async resolve(credentialRef: string): Promise<string | null> {
    if (credentialRef !== AI_CONTENT_DETECTOR_CREDENTIAL_REF) return null;
    const value = this.#env[ENV_NAME]?.trim();
    return value || await this.#stored();
  }

  async status(): Promise<CredentialStatus> {
    if (this.#env[ENV_NAME]?.trim()) {
      return { configured: true, source: "environment", apiVerified: false, detectionVerified: false };
    }
    const stored = await this.#stored();
    return {
      configured: Boolean(stored),
      source: stored ? "user-config" : null,
      apiVerified: false,
      detectionVerified: false
    };
  }

  async save(value: string): Promise<void> {
    const key = checkedKey(value);
    const directory = path.dirname(this.#configPath);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const directoryInfo = await lstat(directory);
    const uid = currentUid();
    if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()
      || (uid !== null && directoryInfo.uid !== uid)) {
      throw new Error("Zhuque credential directory is not owned by the current user");
    }
    if (uid !== null) await chmod(directory, 0o700);

    try {
      const existing = await lstat(this.#configPath);
      assertPrivateFile(existing);
    } catch (error) {
      if (!isMissing(error)) throw error;
    }

    const temporaryPath = path.join(directory, `.credentials-${randomBytes(12).toString("hex")}`);
    let handle;
    try {
      handle = await open(temporaryPath, "wx", 0o600);
      await handle.writeFile(JSON.stringify({ [ENV_NAME]: key }) + "\n", "utf8");
      await handle.sync();
      await handle.close();
      handle = undefined;
      await rename(temporaryPath, this.#configPath);
      if (uid !== null) await chmod(this.#configPath, 0o600);
      if (await this.#stored() !== key) throw new Error("Zhuque credential verification failed");
    } finally {
      await handle?.close();
      await unlink(temporaryPath).catch(error => {
        if (!isMissing(error)) throw error;
      });
    }
  }
}
