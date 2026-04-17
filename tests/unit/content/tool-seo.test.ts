import { findToolContent, toolContent } from "@/content/tool-seo";
import { tools } from "@/content/tools";
import { describe, expect, it } from "vitest";

describe("toolContent", () => {
  it("has an entry for every tool slug", () => {
    for (const t of tools) {
      expect(toolContent[t.slug], `missing content for ${t.slug}`).toBeDefined();
    }
  });

  it("every entry has substantive sections", () => {
    for (const [slug, c] of Object.entries(toolContent)) {
      expect(c.lead.length, `${slug} lead`).toBeGreaterThan(30);
      expect(c.overview.length, `${slug} overview`).toBeGreaterThan(200);
      expect(c.howTo.length, `${slug} howTo`).toBeGreaterThanOrEqual(3);
      expect(c.examples.length, `${slug} examples`).toBeGreaterThanOrEqual(2);
      expect(c.gotchas.length, `${slug} gotchas`).toBeGreaterThanOrEqual(3);
      expect(c.faq.length, `${slug} faq`).toBeGreaterThanOrEqual(5);
      expect(c.references.length, `${slug} refs`).toBeGreaterThanOrEqual(2);
    }
  });

  it("every `related` slug refers to an existing tool", () => {
    const slugs = new Set(tools.map((t) => t.slug));
    for (const [slug, c] of Object.entries(toolContent)) {
      for (const r of c.related) {
        expect(slugs.has(r), `${slug} -> unknown related slug "${r}"`).toBe(true);
      }
    }
  });

  it("every reference url uses https", () => {
    for (const [slug, c] of Object.entries(toolContent)) {
      for (const r of c.references) {
        expect(r.url.startsWith("https://"), `${slug} ref "${r.title}" not https`).toBe(true);
      }
    }
  });

  it("faq questions are unique within each tool", () => {
    for (const [slug, c] of Object.entries(toolContent)) {
      const qs = c.faq.map((f) => f.q);
      expect(new Set(qs).size, `${slug} has duplicate faq questions`).toBe(qs.length);
    }
  });

  it("findToolContent returns undefined for unknown slug", () => {
    expect(findToolContent("nonexistent-slug")).toBeUndefined();
  });

  it("findToolContent returns a full entry for a known slug", () => {
    const c = findToolContent("jwt");
    expect(c).toBeDefined();
    expect(c?.lead).toMatch(/jwt/i);
  });
});
