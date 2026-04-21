import { DENYLIST, isDenied } from "@/lib/dossier/denylist";
import { describe, expect, it } from "vitest";

describe("isDenied", () => {
  it("returns denied for an exact match", () => {
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    const r = isDenied(entry);
    expect(r.denied).toBe(true);
    if (r.denied) expect(r.reason).toMatch(/abuse|denylist/i);
  });

  it("matches case-insensitively and ignores a trailing dot", () => {
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    expect(isDenied(entry.toUpperCase()).denied).toBe(true);
    expect(isDenied(`${entry}.`).denied).toBe(true);
  });

  it("returns allowed for a non-denylisted domain", () => {
    expect(isDenied("example.com").denied).toBe(false);
  });

  it("does not match parent / sibling domains of a listed entry", () => {
    // a.bad.example listed must NOT deny bad.example or c.bad.example
    // (denylist is exact-match only, by design)
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    const parent = entry.split(".").slice(-2).join(".");
    if (parent !== entry) {
      expect(isDenied(parent).denied).toBe(false);
    }
  });
});
