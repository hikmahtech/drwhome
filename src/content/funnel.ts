/** Every link to Domain Posture is built here, so the UTM convention lives in one place. */
const BASE = "https://www.domainposture.com";

export type GoTarget = "report" | "full-scan" | "monitoring" | "evidence-pack" | "mcp";

const PATHS: Record<GoTarget, (domain?: string) => string> = {
  report: (d) => (d ? `/d/${encodeURIComponent(d)}` : "/"),
  "full-scan": (d) => (d ? `/full-scan?domain=${encodeURIComponent(d)}` : "/full-scan"),
  monitoring: () => "/pricing",
  "evidence-pack": () => "/evidence-pack",
  mcp: () => "/mcp",
};

export const isGoTarget = (s: string): s is GoTarget => s in PATHS;

export function domainPostureUrl(
  target: GoTarget,
  opts: { domain?: string; from?: string; medium?: "tool" | "mcp" | "page" } = {},
): string {
  const url = new URL(PATHS[target](opts.domain), BASE);
  url.searchParams.set("utm_source", "drwho.me");
  url.searchParams.set("utm_medium", opts.medium ?? "tool");
  if (opts.from) url.searchParams.set("utm_campaign", opts.from);
  return url.toString();
}
