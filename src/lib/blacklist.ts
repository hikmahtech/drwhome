// Blacklist / RBL checker. Resolves a domain's web (A) and mail (MX) IPs and
// queries a curated set of DNS blocklists (DNSBLs) that answer over public DoH.
//
// RESOLVER NOTE: many DNSBLs — Spamhaus most notably — refuse queries from public
// resolvers like Cloudflare and return a block sentinel in 127.255.255.0/24
// instead of a real listing. We therefore query only lists verified to answer
// correctly over Cloudflare DoH (2026-08-31), and treat any 127.255.255.x answer
// as "unavailable", never "listed". Adding Spamhaus needs a Data Query Service key.

const DOH = "https://cloudflare-dns.com/dns-query";
const TIMEOUT_MS = 6000;

export type Dnsbl = { id: string; name: string; zone: string; site: string };

/** Curated DNSBLs that answer standard 127.0.0.x codes over Cloudflare DoH. */
export const DNSBLS: readonly Dnsbl[] = [
  {
    id: "barracuda",
    name: "Barracuda",
    zone: "b.barracudacentral.org",
    site: "https://www.barracudacentral.org/rbl",
  },
  {
    id: "spamcop",
    name: "SpamCop",
    zone: "bl.spamcop.net",
    site: "https://www.spamcop.net/bl.shtml",
  },
  {
    id: "uceprotect1",
    name: "UCEPROTECT L1",
    zone: "dnsbl-1.uceprotect.net",
    site: "https://www.uceprotect.net/en/index.php",
  },
  {
    id: "mailspike",
    name: "Mailspike",
    zone: "bl.mailspike.net",
    site: "https://www.mailspike.org/",
  },
  { id: "psbl", name: "PSBL", zone: "psbl.surriel.com", site: "https://psbl.org/" },
  {
    id: "s5h",
    name: "s5h.net",
    zone: "all.s5h.net",
    site: "https://www.usenix.org.uk/content/rbl.html",
  },
] as const;

const DOMAIN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export type ListStatus = "listed" | "clean" | "unavailable";
export type IpListing = { list: string; listId: string; status: ListStatus; codes: string[] };
export type IpResult = {
  ip: string;
  source: "web" | "mail";
  listings: IpListing[];
  listedOn: number;
};
export type BlacklistResult =
  | { ok: true; domain: string; ips: IpResult[]; checkedLists: number; listedIps: number }
  | { ok: false; error: string };

type DohAnswer = { name: string; type: number; TTL: number; data: string };

async function dohA(name: string): Promise<DohAnswer[] | null> {
  try {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=A`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { Status: number; Answer?: DohAnswer[] };
    if (d.Status !== 0) return []; // NXDOMAIN / no data = not listed
    return d.Answer ?? [];
  } catch {
    return null; // network/timeout = unknown
  }
}

/** Reverse the octets of an IPv4 address, as DNSBL queries require. */
export function reverseIpv4(ip: string): string | null {
  const m = IPV4.exec(ip);
  if (!m) return null;
  const oct = [m[1], m[2], m[3], m[4]].map(Number);
  if (oct.some((o) => o < 0 || o > 255)) return null;
  return `${oct[3]}.${oct[2]}.${oct[1]}.${oct[0]}`;
}

/**
 * A 127.x answer means "listed", EXCEPT public-resolver block sentinels in
 * 127.255.255.0/24 (Spamhaus-style), which mean "we could not check". `null`
 * answers (network error) are "unavailable"; an empty array is "clean".
 */
export function classifyAnswers(ans: DohAnswer[] | null): { status: ListStatus; codes: string[] } {
  if (ans === null) return { status: "unavailable", codes: [] };
  const data = ans.filter((r) => r.type === 1).map((r) => r.data);
  if (data.some((d) => d.startsWith("127.255.255."))) return { status: "unavailable", codes: data };
  const real = data.filter((d) => d.startsWith("127.") && !d.startsWith("127.255.255."));
  return real.length > 0 ? { status: "listed", codes: real } : { status: "clean", codes: [] };
}

async function ipsForDomain(domain: string): Promise<{ ip: string; source: "web" | "mail" }[]> {
  const out = new Map<string, "web" | "mail">();
  // web: A records of the apex
  const a = await dohA(domain);
  for (const r of a ?? []) if (r.type === 1) out.set(r.data, out.get(r.data) ?? "web");
  // mail: MX hosts → their A records
  try {
    const mxRes = await fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (mxRes.ok) {
      const d = (await mxRes.json()) as { Status: number; Answer?: DohAnswer[] };
      const hosts = (d.Answer ?? [])
        .filter((r) => r.type === 15)
        .map((r) => r.data.split(/\s+/).pop()?.replace(/\.$/, "") ?? "")
        .filter(Boolean)
        .slice(0, 3);
      const settled = await Promise.all(hosts.map((h) => dohA(h)));
      for (const ans of settled)
        for (const r of ans ?? []) if (r.type === 1) out.set(r.data, "mail");
    }
  } catch {
    /* MX resolution failure is non-fatal; we still check the web IPs */
  }
  return [...out.entries()].map(([ip, source]) => ({ ip, source }));
}

/**
 * Check a domain's web + mail IPs against the DNSBLs. Caps the IP fan-out to
 * bound the number of DoH queries (IPs × lists). IPv6 IPs are skipped (these
 * lists are IPv4-only).
 */
export async function checkBlacklists(domainRaw: string): Promise<BlacklistResult> {
  const domain = domainRaw.trim().toLowerCase().replace(/\.$/, "");
  if (!DOMAIN.test(domain)) return { ok: false, error: "invalid domain" };

  const ipList = (await ipsForDomain(domain)).slice(0, 4);
  if (ipList.length === 0) {
    return { ok: false, error: "no A or MX records resolved for this domain" };
  }

  const ips: IpResult[] = [];
  for (const { ip, source } of ipList) {
    const rev = reverseIpv4(ip);
    if (!rev) continue; // skip IPv6
    const listings = await Promise.all(
      DNSBLS.map(async (bl): Promise<IpListing> => {
        const { status, codes } = classifyAnswers(await dohA(`${rev}.${bl.zone}`));
        return { list: bl.name, listId: bl.id, status, codes };
      }),
    );
    ips.push({
      ip,
      source,
      listings,
      listedOn: listings.filter((l) => l.status === "listed").length,
    });
  }

  return {
    ok: true,
    domain,
    ips,
    checkedLists: DNSBLS.length,
    listedIps: ips.filter((i) => i.listedOn > 0).length,
  };
}
