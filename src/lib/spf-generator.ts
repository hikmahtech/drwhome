// Pure SPF record builder. Turns form inputs into a valid `v=spf1` TXT record and warns about
// the two things that actually break SPF: the wrong "all" mechanism and blowing the 10-DNS-
// lookup limit. String logic only, no network.

export type SpfAll = "-all" | "~all" | "?all" | "+all";

export type SpfInput = {
  /** Authorize the domain's own A/AAAA records. */
  a?: boolean;
  /** Authorize the domain's MX hosts. */
  mx?: boolean;
  /** Literal IPv4 addresses or CIDRs. */
  ip4?: string[];
  /** Literal IPv6 addresses or CIDRs. */
  ip6?: string[];
  /** include: mechanisms (e.g. _spf.google.com). */
  includes?: string[];
  all: SpfAll;
};

export type SpfOutput = { record: string; warnings: string[]; lookups: number };

const IP4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/\d{1,2})?$/;
const IP6 = /^[0-9a-f:]+(\/\d{1,3})?$/i;

/** Validate an IPv4 address or CIDR, checking each octet is 0-255. */
function isValidIp4(s: string): boolean {
  const m = IP4.exec(s);
  if (!m) return false;
  if (m[5]) {
    const prefix = Number(m[5].slice(1));
    if (prefix > 32) return false;
  }
  return [m[1], m[2], m[3], m[4]].every((o) => Number(o) <= 255);
}

function clean(list: string[] | undefined): string[] {
  return (list ?? []).map((s) => s.trim().replace(/^include:/i, "")).filter(Boolean);
}

export function buildSpfRecord(input: SpfInput): SpfOutput {
  const warnings: string[] = [];
  const mechanisms: string[] = [];

  if (input.a) mechanisms.push("a");
  if (input.mx) mechanisms.push("mx");

  const ip4 = clean(input.ip4);
  const ip6 = clean(input.ip6);
  for (const ip of ip4) {
    if (isValidIp4(ip)) mechanisms.push(`ip4:${ip}`);
    else warnings.push(`ignored invalid IPv4: ${ip}`);
  }
  for (const ip of ip6) {
    if (IP6.test(ip) && ip.includes(":")) mechanisms.push(`ip6:${ip}`);
    else warnings.push(`ignored invalid IPv6: ${ip}`);
  }

  const includes = clean(input.includes);
  for (const inc of includes) mechanisms.push(`include:${inc}`);

  // The SPF 10-DNS-lookup limit: a, mx, and each include cost one lookup; ip4/ip6 are free.
  // Exceeding 10 makes SPF PermError, and SPF fails entirely.
  const lookups = (input.a ? 1 : 0) + (input.mx ? 1 : 0) + includes.length;
  if (lookups > 10) {
    warnings.push(
      `${lookups} DNS lookups — SPF allows at most 10 (a, mx and each include count). Over the limit, SPF returns PermError and fails. Flatten or drop includes.`,
    );
  }

  if (input.all === "+all") {
    warnings.push(
      "+all authorizes ANY server to send as your domain — it defeats SPF. Use -all or ~all.",
    );
  }
  if (input.all === "?all") {
    warnings.push(
      "?all is neutral — receivers treat it like no SPF policy. Use ~all (softfail) or -all (hardfail).",
    );
  }

  const record = ["v=spf1", ...mechanisms, input.all].join(" ");
  return { record, warnings, lookups };
}
