import sitemap from "@/app/sitemap";
import { describe, expect, it } from "vitest";

describe("sitemap", () => {
  it("does not include any /d/ dynamic dossier paths", () => {
    const entries = sitemap();
    for (const e of entries) {
      expect(e.url).not.toMatch(/\/d\//);
    }
  });

  it("includes every /tools/dossier-* slug", () => {
    const entries = sitemap().map((e) => e.url);
    const dossierSlugs = [
      "dossier-dns",
      "dossier-mx",
      "dossier-spf",
      "dossier-dmarc",
      "dossier-dkim",
      "dossier-tls",
      "dossier-redirects",
      "dossier-headers",
      "dossier-cors",
      "dossier-web-surface",
    ];
    for (const slug of dossierSlugs) {
      expect(entries.some((u) => u.endsWith(`/tools/${slug}`))).toBe(true);
    }
  });
});
