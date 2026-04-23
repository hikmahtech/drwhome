import { popularDomains } from "@/lib/seo/popular-domains";
import { describe, expect, it } from "vitest";

const DOMAIN_RE = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)+$/;

describe("popularDomains", () => {
  it("has at least 150 entries", () => {
    expect(popularDomains.length).toBeGreaterThanOrEqual(150);
  });

  it("contains no duplicates", () => {
    expect(new Set(popularDomains).size).toBe(popularDomains.length);
  });

  it("all entries are lowercase valid domain syntax", () => {
    for (const d of popularDomains) {
      expect(d).toBe(d.toLowerCase());
      expect(d).toMatch(DOMAIN_RE);
      expect(d).not.toContain(" ");
      expect(d).not.toContain("/");
    }
  });
});
