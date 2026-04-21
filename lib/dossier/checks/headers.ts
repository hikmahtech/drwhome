import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type HeadersCheckData = { finalUrl: string; headers: Record<string, string> };

const DEFAULT_TIMEOUT_MS = 5_000;

export const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

export async function headersCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<HeadersCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${v.domain}/`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return {
      status: "ok",
      data: { finalUrl: res.url, headers },
      fetchedAt: new Date().toISOString(),
    };
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
