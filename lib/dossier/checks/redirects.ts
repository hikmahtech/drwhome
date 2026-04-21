import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type RedirectHop = { url: string; status: number };
export type RedirectsCheckData = { hops: RedirectHop[]; finalStatus: number };

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_HOPS = 10;

export async function redirectsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number; maxHops?: number } = {},
): Promise<CheckResult<RedirectsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxHops = opts.maxHops ?? DEFAULT_MAX_HOPS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const hops: RedirectHop[] = [];
  let url = `https://${v.domain}/`;

  try {
    for (let i = 0; i <= maxHops; i++) {
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)" },
        signal: controller.signal,
      });
      hops.push({ url, status: res.status });
      if (res.status < 300 || res.status >= 400) {
        clearTimeout(timer);
        return {
          status: "ok",
          data: { hops, finalStatus: res.status },
          fetchedAt: new Date().toISOString(),
        };
      }
      const loc = res.headers.get("location");
      if (!loc) {
        clearTimeout(timer);
        return {
          status: "error",
          message: `redirect ${res.status} with no Location header`,
        };
      }
      url = new URL(loc, url).toString();
    }
    clearTimeout(timer);
    return { status: "error", message: `redirect cap exceeded (${maxHops})` };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : "unknown error",
    };
  }
}
