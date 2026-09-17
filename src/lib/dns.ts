// Pure DNS-over-HTTPS lookup against Cloudflare's public resolver. Runs in the browser: the
// query goes straight from the visitor to cloudflare-dns.com, listed in the page's CSP.

export const DNS_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA", "SRV"] as const;
export type DnsType = (typeof DNS_TYPES)[number];

export type DnsAnswer = { name: string; type: string; TTL: number; data: string };
export type DnsResult = { ok: true; answers: DnsAnswer[] } | { ok: false; error: string };

// Allows underscore labels (_dmarc, _sip._tcp, …) alongside ordinary DNS names.
const DOMAIN = /^[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?(\.[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?)+$/i;

// Cloudflare's DNS-JSON API answers with the numeric RR type from RFC 1035. Map back to the
// mnemonic for the types this tool supports; anything else is shown as its number.
const TYPE_NUMBERS: Partial<Record<number, DnsType>> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};
const typeName = (n: number): string => TYPE_NUMBERS[n] ?? String(n);

type CfAnswer = { name: string; type: number; TTL: number; data: string };
type CfResponse = { Status: number; Answer?: CfAnswer[] };

export async function resolveDns(name: string, type: DnsType): Promise<DnsResult> {
  const d = name.trim().toLowerCase().replace(/\.$/, "");
  if (!DOMAIN.test(d)) return { ok: false, error: "That is not a valid domain name." };
  if (!DNS_TYPES.includes(type)) return { ok: false, error: "Unsupported record type." };

  let res: Response;
  try {
    res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${type}`,
      { headers: { accept: "application/dns-json" } },
    );
  } catch {
    return { ok: false, error: "The DNS resolver did not answer." };
  }
  if (!res.ok)
    return { ok: false, error: `The DNS resolver answered with an error (${res.status}).` };

  let data: CfResponse;
  try {
    data = (await res.json()) as CfResponse;
  } catch {
    return { ok: false, error: "The DNS resolver sent back something that was not JSON." };
  }

  // Status 3 = NXDOMAIN: the name itself does not exist. That is a different verdict from
  // Status 0 with no answers, which means the name exists but has no records of this type.
  if (data.Status === 3) return { ok: false, error: `${d} does not exist (NXDOMAIN).` };
  if (data.Status !== 0)
    return { ok: false, error: `The resolver returned status ${data.Status}.` };

  const answers = (data.Answer ?? []).map((a) => ({
    name: a.name,
    type: typeName(a.type),
    TTL: a.TTL,
    data: a.data,
  }));
  return { ok: true, answers };
}
