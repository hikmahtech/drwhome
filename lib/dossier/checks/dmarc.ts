import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type DmarcCheckData = { record: string; tags: Record<string, string> };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  return txt
    .split(/"\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

function parseTags(record: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

export async function dmarcCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<DmarcCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(`_dmarc.${v.domain}`, "TXT", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };

    const matches = r.answers
      .map((a) => unquote(a.data))
      .filter((s) => /^v=DMARC1(;|\s|$)/i.test(s));

    if (matches.length === 0) return { status: "not_applicable", reason: "no DMARC record" };
    if (matches.length > 1) {
      return {
        status: "error",
        message: `multiple DMARC records found (${matches.length}); RFC 7489 forbids this`,
      };
    }
    const record = matches[0];
    return {
      status: "ok",
      data: { record, tags: parseTags(record) },
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
