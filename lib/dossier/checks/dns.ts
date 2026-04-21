import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export const DNS_DOSSIER_TYPES = ["A", "AAAA", "NS", "SOA", "CAA", "TXT"] as const;
export type DnsDossierType = (typeof DNS_DOSSIER_TYPES)[number];

export type DnsAnswer = { name: string; type: number; TTL: number; data: string };
export type DnsCheckData = { records: Record<DnsDossierType, DnsAnswer[]> };

const DEFAULT_TIMEOUT_MS = 5_000;

export async function dnsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<DnsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const queries = DNS_DOSSIER_TYPES.map(async (type) => {
      const r = await dohFetch(v.domain, type, { signal: controller.signal });
      if (!r.ok) throw new Error(`${type}: ${r.reason}`);
      return [type, r.answers] as const;
    });

    const settled = await Promise.all(queries);
    clearTimeout(timer);

    const records = Object.fromEntries(settled) as Record<DnsDossierType, DnsAnswer[]>;
    const totalAnswers = Object.values(records).reduce((a, b) => a + b.length, 0);
    if (totalAnswers === 0) return { status: "not_applicable", reason: "no DNS records found" };
    return { status: "ok", data: { records }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
