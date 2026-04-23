import { findPost, posts } from "@/content/posts";
import { describe, expect, it } from "vitest";

describe("posts registry", () => {
  it("is non-empty", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("contains all launch articles", () => {
    const slugs = posts.map((p) => p.slug).sort();
    expect(slugs).toEqual([
      "base64-isnt-encryption",
      "debug-redirect-chain",
      "decode-jwt-without-verifying",
      "dkim-selectors-explained",
      "dns-over-https-cloudflare-primer",
      "email-deliverability-checklist",
      "reading-ip-from-vercel-edge-headers",
      "security-headers-guide",
      "spf-10-lookup-limit",
      "uuidv4-vs-uuidv7",
      "what-is-dmarc",
    ]);
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
