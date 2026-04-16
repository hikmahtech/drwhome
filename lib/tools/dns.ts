export const DNS_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] as const;
export type DnsType = (typeof DNS_TYPES)[number];

export type DnsAnswer = { name: string; type: number; TTL: number; data: string };
export type DnsResult = { ok: true; answers: DnsAnswer[] } | { ok: false; error: string };

const DOMAIN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export async function resolveDns(domain: string, type: DnsType): Promise<DnsResult> {
  const d = domain.trim().toLowerCase();
  if (!DOMAIN.test(d)) return { ok: false, error: "invalid domain" };
  if (!DNS_TYPES.includes(type)) return { ok: false, error: "unsupported record type" };

  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${type}`,
    { headers: { Accept: "application/dns-json" } },
  );
  if (!res.ok) return { ok: false, error: `upstream error: ${res.status}` };
  const data = (await res.json()) as { Status: number; Answer?: DnsAnswer[] };
  if (data.Status !== 0) return { ok: false, error: `dns status ${data.Status}` };
  return { ok: true, answers: data.Answer ?? [] };
}
