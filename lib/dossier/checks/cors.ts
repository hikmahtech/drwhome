import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type CorsCheckData = {
  origin: string;
  method: string;
  preflightStatus: number;
  allowOrigin?: string;
  allowMethods?: string;
  allowHeaders?: string;
  allowCredentials?: string;
  maxAge?: string;
  exposeHeaders?: string;
  anyAcHeader: boolean;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_ORIGIN = "https://drwho.me";
const DEFAULT_METHOD = "GET";

export async function corsCheck(
  rawDomain: string,
  opts: { origin?: string; method?: string; timeoutMs?: number } = {},
): Promise<CheckResult<CorsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const origin = opts.origin ?? DEFAULT_ORIGIN;
  const method = (opts.method ?? DEFAULT_METHOD).toUpperCase();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${v.domain}/`, {
      method: "OPTIONS",
      redirect: "manual",
      headers: {
        "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)",
        Origin: origin,
        "Access-Control-Request-Method": method,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const h = res.headers;
    const allowOrigin = h.get("access-control-allow-origin") ?? undefined;
    const allowMethods = h.get("access-control-allow-methods") ?? undefined;
    const allowHeaders = h.get("access-control-allow-headers") ?? undefined;
    const allowCredentials = h.get("access-control-allow-credentials") ?? undefined;
    const maxAge = h.get("access-control-max-age") ?? undefined;
    const exposeHeaders = h.get("access-control-expose-headers") ?? undefined;
    const anyAcHeader = Boolean(
      allowOrigin || allowMethods || allowHeaders || allowCredentials || maxAge || exposeHeaders,
    );

    return {
      status: "ok",
      data: {
        origin,
        method,
        preflightStatus: res.status,
        allowOrigin,
        allowMethods,
        allowHeaders,
        allowCredentials,
        maxAge,
        exposeHeaders,
        anyAcHeader,
      },
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
