import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type MxRecord = { priority: number; exchange: string };
export type MxCheckData = { records: MxRecord[] };

const DEFAULT_TIMEOUT_MS = 5_000;

export async function mxCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<MxCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(v.domain, "MX", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };
    if (r.answers.length === 0) return { status: "not_applicable", reason: "no MX records" };

    const records: MxRecord[] = [];
    for (const a of r.answers) {
      const parts = a.data.trim().split(/\s+/);
      if (parts.length < 2) continue;
      const priority = Number.parseInt(parts[0], 10);
      if (!Number.isFinite(priority)) continue;
      records.push({ priority, exchange: parts.slice(1).join(" ") });
    }
    if (records.length === 0)
      return { status: "not_applicable", reason: "no parseable MX records" };

    records.sort((a, b) => a.priority - b.priority);
    return { status: "ok", data: { records }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
