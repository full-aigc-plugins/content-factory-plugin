import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { ContentFactoryError } from "../errors.ts";

export type ResolveHost = (hostname: string) => Promise<string[]>;

export type UrlPolicyOptions = {
  resolveHost?: ResolveHost;
};

function ipv4Parts(address: string): number[] | null {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts;
}

function isPrivateIpv4(address: string): boolean {
  const parts = ipv4Parts(address);
  if (!parts) return true;
  const [a, b, c] = parts;

  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("ff")) return true;
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }
  return false;
}

export function isPrivateNetworkAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

async function defaultResolveHost(hostname: string): Promise<string[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map(item => item.address);
}

export async function assertPublicHttpUrl(
  input: string | URL,
  options: UrlPolicyOptions = {}
): Promise<URL> {
  let url: URL;
  try {
    url = input instanceof URL ? new URL(input) : new URL(input);
  } catch {
    throw new ContentFactoryError({
      code: "SOURCE_URL_INVALID",
      message: "source URL is invalid",
      retryable: false
    });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ContentFactoryError({
      code: "SOURCE_URL_SCHEME_UNSUPPORTED",
      message: "source URL must use HTTP or HTTPS",
      retryable: false,
      details: { protocol: url.protocol }
    });
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new ContentFactoryError({
      code: "SOURCE_URL_PRIVATE_NETWORK",
      message: "source URL must not target the local network",
      retryable: false,
      details: { hostname }
    });
  }

  if (isIP(hostname)) {
    if (isPrivateNetworkAddress(hostname)) {
      throw new ContentFactoryError({
        code: "SOURCE_URL_PRIVATE_NETWORK",
        message: "source URL must not target a private or special-use address",
        retryable: false,
        details: { hostname, address: hostname }
      });
    }
    return url;
  }

  const resolveHost = options.resolveHost ?? defaultResolveHost;
  let addresses: string[];
  try {
    addresses = await resolveHost(hostname);
  } catch (error) {
    throw new ContentFactoryError({
      code: "SOURCE_URL_DNS_FAILED",
      message: "source host could not be resolved",
      retryable: true,
      details: { hostname, cause: error instanceof Error ? error.message : String(error) }
    });
  }

  if (addresses.length === 0) {
    throw new ContentFactoryError({
      code: "SOURCE_URL_DNS_FAILED",
      message: "source host resolved to no addresses",
      retryable: true,
      details: { hostname }
    });
  }

  const privateAddress = addresses.find(isPrivateNetworkAddress);
  if (privateAddress) {
    throw new ContentFactoryError({
      code: "SOURCE_URL_PRIVATE_NETWORK",
      message: "source host resolves to a private or special-use address",
      retryable: false,
      details: { hostname, address: privateAddress }
    });
  }

  return url;
}
