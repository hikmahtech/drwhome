import { tools } from "@/content/tools";
import { describe, expect, it } from "vitest";

describe("tools registry", () => {
  it("exports an array", () => {
    expect(Array.isArray(tools)).toBe(true);
  });
  it("every tool has required fields and unique slug", () => {
    const slugs = new Set<string>();
    for (const t of tools) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(["network", "dev"]).toContain(t.category);
      expect(slugs.has(t.slug)).toBe(false);
      slugs.add(t.slug);
    }
  });
});
