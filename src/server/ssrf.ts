import dns from "node:dns";
import net, { isIP } from "node:net";
import { resolvesToPublicIp, validateDomain } from "@hikmahtech/dossier-checks";
import { Agent, buildConnector, setGlobalDispatcher, fetch as undiciFetch } from "undici";
import type { Report } from "../reports/report";

/**
 * This server runs inside a private network and fetches sites that visitors name. Two layers
 * keep it from being used to reach internal hosts:
 *
 * 1. guardedRun refuses a domain unless every A/AAAA record is a public address.
 * 2. installNetworkGuard checks the address of EVERY outgoing connection at connect time, at
 *    the socket layer, whatever library opens it. That covers what layer 1 cannot: a redirect
 *    to http://10.x.x.x/, a DNS answer that changes between the check and the connection (DNS
 *    rebinding), and sockets opened outside fetch: the TLS check uses node:tls directly, and
 *    the WHOIS check follows referral hostnames taken from a registrar's reply.
 *
 * This process never needs a private address: it has no database, cache or internal API.
 */

const V4_BLOCKED: [number, number, number][] = [
  // [first octet, second octet or -1, prefix length]; matched by isPublicV4 below.
  [0, -1, 8],
  [10, -1, 8],
  [100, 64, 10],
  [127, -1, 8],
  [169, 254, 16],
  [172, 16, 12],
  [192, 0, 24],
  [192, 168, 16],
  [198, 18, 15],
  [224, -1, 4],
  [240, -1, 4],
];

function isPublicV4(ip: string): boolean {
  const o = ip.split(".").map(Number);
  if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const value = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  for (const [a, b, bits] of V4_BLOCKED) {
    const base = ((a << 24) | ((b < 0 ? 0 : b) << 16)) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((value & mask) === (base & mask)) return false;
  }
  return true;
}

function isPublicV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // IPv4-mapped (::ffff:a.b.c.d) is judged as the IPv4 address it carries.
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicV4(mapped[1]);
  if (lower === "::" || lower === "::1") return false;
  const first = Number.parseInt(lower.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return false; // fe80::/10 link local
  if ((first & 0xff00) === 0xff00) return false; // ff00::/8 multicast
  if (lower.startsWith("::ffff:")) return false; // mapped, in hex form: refuse rather than parse
  if (lower.startsWith("64:ff9b:")) return false; // NAT64 can address IPv4 space
  return true;
}

export function isPublicAddress(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "");
  const kind = isIP(bare);
  if (kind === 4) return isPublicV4(bare);
  if (kind === 6) return isPublicV6(bare);
  return false;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address?: string | { address: string; family: number }[],
  family?: number,
) => void;

// Captured before installNetworkGuard replaces dns.lookup, so the guard can still resolve.
const systemLookup = dns.lookup;

/** dns.lookup, but it fails unless every address it would return is public. */
export function guardedLookup(
  hostname: string,
  options: object | number | LookupCallback,
  callback?: LookupCallback,
): void {
  // dns.lookup(hostname, callback) and dns.lookup(hostname, family, callback) are both legal.
  if (typeof options === "function") {
    guardedLookup(hostname, {}, options as LookupCallback);
    return;
  }
  if (typeof options === "number") {
    guardedLookup(hostname, { family: options }, callback);
    return;
  }
  const done = callback as LookupCallback;
  systemLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return done(err);
    const blocked = addresses.find((a) => !isPublicAddress(a.address));
    if (blocked || addresses.length === 0) return done(blockedError(hostname));
    if ((options as { all?: boolean }).all) return done(null, addresses);
    done(null, addresses[0].address, addresses[0].family);
  });
}

function blockedError(host: string): NodeJS.ErrnoException {
  const e: NodeJS.ErrnoException = new Error(`refused: ${host} is not a public address`);
  e.code = "ERR_BLOCKED_ADDRESS";
  return e;
}

/** The host a net.connect() call names. Its forms: (options), (port, host?), (path). */
function connectHost(args: unknown[]): string | null {
  const [first, second] = Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
  if (typeof first === "object" && first !== null) {
    const o = first as { host?: string; path?: string };
    return o.path ? null : (o.host ?? "localhost");
  }
  if (typeof first === "number" || /^\d+$/.test(String(first))) {
    return typeof second === "string" ? second : "localhost";
  }
  return null; // a pipe path
}

let installed = false;

export function installNetworkGuard(): void {
  if (installed) return;
  installed = true;

  // Socket layer. Names go through dns.lookup, which net and tls read at call time, so
  // replacing it guards them all. An IP literal never reaches a lookup, so connect() itself
  // refuses a private one.
  dns.lookup = guardedLookup as typeof dns.lookup;
  const socketConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function guardedConnect(this: net.Socket, ...args: unknown[]) {
    const host = connectHost(args)?.replace(/^\[|\]$/g, "");
    if (host && isIP(host) && !isPublicAddress(host)) {
      process.nextTick(() => this.destroy(blockedError(host)));
      return this;
    }
    return socketConnect.apply(this, args as never);
  } as typeof net.Socket.prototype.connect;

  const connect = buildConnector({ lookup: guardedLookup as never });
  const agent = new Agent({
    connect: (opts, callback) => {
      // An IP literal never reaches dns.lookup, so it is checked here.
      const host = opts.hostname.replace(/^\[|\]$/g, "");
      if (isIP(host) && !isPublicAddress(host)) {
        return callback(new Error(`refused: ${host} is not a public address`), null);
      }
      return connect(opts, callback);
    },
  });
  setGlobalDispatcher(agent);
  // The check package calls the global fetch. Point it at the same undici whose dispatcher we
  // just set, so the guard cannot be skipped by a version mismatch with Node's built-in copy.
  globalThis.fetch = undiciFetch as unknown as typeof fetch;
}

/** Runs a server-side check on a visitor-supplied domain, after the public-address test. */
export async function guardedRun(
  rawDomain: string,
  run: (domain: string) => Promise<Report>,
): Promise<Report> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { verdict: `Not a valid domain: ${v.reason}`, tone: "bad", rows: [] };
  const guard = await resolvesToPublicIp(v.domain);
  if (!guard.ok) {
    return { verdict: "This domain does not resolve to a public address.", tone: "bad", rows: [] };
  }
  return run(v.domain);
}
