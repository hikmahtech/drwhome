import { findPost, posts } from "@/content/posts";
import { describe, expect, it } from "vitest";

describe("posts registry", () => {
  it("is a valid array (populated once MDX pipeline lands in Task 3)", () => {
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThanOrEqual(0);
  });

  it("sorts posts newest-first when populated", () => {
    const dates = posts.map((p) => p.date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("every slug is unique", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("findPost returns undefined for unknown slug", () => {
    expect(findPost("does-not-exist")).toBeUndefined();
  });
});
