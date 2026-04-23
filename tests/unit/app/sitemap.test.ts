import sitemap from "@/app/sitemap";
import { popularDomains } from "@/lib/seo/popular-domains";
import { describe, expect, it } from "vitest";

describe("sitemap", () => {
  it("includes every /tools/<slug> route", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/tools/dmarc-checker"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/tools/base64"))).toBe(true);
  });

  it("includes the tools hub and domain-dossier landing", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/tools"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/domain-dossier"))).toBe(true);
  });

  it("includes every popular /d/<domain> seed", () => {
    const entries = sitemap().map((e) => e.url);
    for (const d of popularDomains) {
      expect(entries.some((u) => u.endsWith(`/d/${d}`))).toBe(true);
    }
  });

  it("does not include duplicates", () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("mcp client landings are listed", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/mcp/claude"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/mcp/cursor"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/mcp/openai"))).toBe(true);
  });
});
