import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type SpfCheckData = { record: string; mechanisms: string[] };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  // DoH returns TXT as quoted segments separated by whitespace: '"seg1" "seg2"'.
  // Strip surrounding quotes, join inter-segment whitespace away.
  return txt
    .split(/"\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

export async function spfCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<SpfCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(v.domain, "TXT", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };

    const matches = r.answers.map((a) => unquote(a.data)).filter((s) => /^v=spf1(\s|$)/i.test(s));

    if (matches.length === 0) return { status: "not_applicable", reason: "no SPF record" };
    if (matches.length > 1) {
      return {
        status: "error",
        message: `multiple SPF records found (${matches.length}); RFC 7208 forbids this`,
      };
    }

    const record = matches[0];
    const mechanisms = record.split(/\s+/).filter(Boolean);
    return { status: "ok", data: { record, mechanisms }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
