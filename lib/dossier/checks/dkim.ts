import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export const DEFAULT_DKIM_SELECTORS = [
  "default",
  "google",
  "k1",
  "selector1",
  "selector2",
  "mxvault",
] as const;

export type DkimSelectorResult =
  | { selector: string; status: "found"; record: string }
  | { selector: string; status: "not_found" };

export type DkimCheckData = { selectors: DkimSelectorResult[] };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  return txt
    .split(/"\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

export async function dkimCheck(
  rawDomain: string,
  opts: { selectors?: readonly string[]; timeoutMs?: number } = {},
): Promise<CheckResult<DkimCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const selectors = opts.selectors ?? DEFAULT_DKIM_SELECTORS;
  if (selectors.length === 0) return { status: "error", message: "no selectors to probe" };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const probes = selectors.map(async (selector): Promise<DkimSelectorResult> => {
      const r = await dohFetch(`${selector}._domainkey.${v.domain}`, "TXT", {
        signal: controller.signal,
      });
      if (!r.ok) return { selector, status: "not_found" };
      const match = r.answers
        .map((a) => unquote(a.data))
        .find((s) => /(^|;\s*)v=DKIM1/i.test(s) || /^p=/i.test(s));
      if (!match) return { selector, status: "not_found" };
      return { selector, status: "found", record: match };
    });
    const results = await Promise.all(probes);
    clearTimeout(timer);
    const anyFound = results.some((r) => r.status === "found");
    if (!anyFound) {
      return {
        status: "not_applicable",
        reason: `no DKIM record on probed selectors (${selectors.join(", ")})`,
      };
    }
    return { status: "ok", data: { selectors: results }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
