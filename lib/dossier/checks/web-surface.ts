import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type WebSurfaceData = {
  robots: { present: boolean; body?: string };
  sitemap: { present: boolean; urlCount?: number };
  head: {
    title?: string;
    description?: string;
    og: Record<string, string>;
    twitter: Record<string, string>;
  };
};

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_FETCH_BYTES = 64 * 1024;
const ROBOTS_TRUNCATE = 4 * 1024;
const UA = "drwho-dossier/1.0 (+https://drwho.me)";

type TextFetch = { ok: boolean; status: number; body: string };

async function getText(url: string, signal: AbortSignal): Promise<TextFetch> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
    signal,
  });

  if (!res.body) {
    const body = await res.text();
    return { ok: res.ok, status: res.status, body: body.slice(0, MAX_FETCH_BYTES) };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let body = "";
  let total = 0;
  try {
    while (total < MAX_FETCH_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      body += decoder.decode(value, { stream: true });
      if (total >= MAX_FETCH_BYTES) break;
    }
    body += decoder.decode();
  } finally {
    // Abort the rest of the stream so the server can stop sending.
    await reader.cancel().catch(() => {});
  }
  return { ok: res.ok, status: res.status, body: body.slice(0, MAX_FETCH_BYTES) };
}

function countSitemapUrls(xml: string): number {
  const m = xml.match(/<loc\b[^>]*>/gi);
  return m ? m.length : 0;
}

function extractTag(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMeta(html: string, attr: "name" | "property", value: string): string | undefined {
  const v = escapeRe(value);
  // Try `attr=... content=...`
  const re1 = new RegExp(`<meta\\s+[^>]*${attr}=["']${v}["'][^>]*content=["']([^"']*)["']`, "i");
  const m1 = html.match(re1);
  if (m1) return m1[1];
  // Try `content=... attr=...` (reversed order)
  const re2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${v}["']`, "i");
  const m2 = html.match(re2);
  return m2 ? m2[1] : undefined;
}

function extractMetaPrefix(
  html: string,
  attr: "name" | "property",
  prefix: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  const pfx = escapeRe(prefix);
  const re = new RegExp(
    `<meta\\s+[^>]*${attr}=["'](${pfx}[^"']*)["'][^>]*content=["']([^"']*)["']`,
    "gi",
  );
  for (const m of html.matchAll(re)) {
    out[m[1]] = m[2];
  }
  return out;
}

export async function webSurfaceCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<WebSurfaceData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const base = `https://${v.domain}`;

  try {
    // robots + sitemap are optional signals (missing/failing → present:false);
    // home-page fetch is un-caught so its failure becomes the whole check's error.
    const [robotsR, sitemapR, homeR] = await Promise.all([
      getText(`${base}/robots.txt`, controller.signal).catch(() => null),
      getText(`${base}/sitemap.xml`, controller.signal).catch(() => null),
      getText(`${base}/`, controller.signal),
    ]);
    clearTimeout(timer);

    const head = homeR.body.slice(0, MAX_BODY_BYTES);
    const title = extractTag(head, "title");
    const description = extractMeta(head, "name", "description");
    const og = extractMetaPrefix(head, "property", "og:");
    const twitter = extractMetaPrefix(head, "name", "twitter:");

    const robots = {
      present: robotsR?.ok === true && robotsR.body.length > 0,
      body: robotsR?.ok ? robotsR.body.slice(0, ROBOTS_TRUNCATE) : undefined,
    };
    const sitemap = {
      present: sitemapR?.ok === true && sitemapR.body.length > 0,
      urlCount: sitemapR?.ok ? countSitemapUrls(sitemapR.body) : undefined,
    };

    return {
      status: "ok",
      data: { robots, sitemap, head: { title, description, og, twitter } },
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
