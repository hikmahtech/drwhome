import {
  buildArticleJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebsiteJsonLd,
  pageMetadata,
} from "@/lib/seo";
import { describe, expect, it } from "vitest";

describe("pageMetadata", () => {
  it("builds canonical + OG + Twitter for a tool-like page", () => {
    const m = pageMetadata({
      title: "dns lookup",
      description: "resolve DNS records.",
      path: "/tools/dns",
      type: "tool",
    });
    expect(m.alternates?.canonical).toBe("/tools/dns");
    expect((m.openGraph as Record<string, unknown>)?.url).toBe("/tools/dns");
    expect((m.openGraph as Record<string, unknown>)?.type).toBe("website");
    expect((m.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
    expect(m.description).toBe("resolve DNS records.");
  });

  it("uses article type for blog posts", () => {
    const m = pageMetadata({
      title: "UUIDv4 vs UUIDv7",
      description: "When to pick which.",
      path: "/blog/uuidv4-vs-uuidv7",
      type: "article",
      publishedTime: "2026-04-18",
    });
    expect((m.openGraph as Record<string, unknown>)?.type).toBe("article");
  });
});

describe("buildSoftwareApplicationJsonLd", () => {
  it("emits required SoftwareApplication fields", () => {
    const j = buildSoftwareApplicationJsonLd({
      name: "dns lookup",
      description: "resolve DNS records.",
      path: "/tools/dns",
      siteUrl: "https://drwho.me",
    });
    expect(j["@context"]).toBe("https://schema.org");
    expect(j["@type"]).toBe("SoftwareApplication");
    expect(j.name).toBe("dns lookup");
    expect(j.url).toBe("https://drwho.me/tools/dns");
    expect(j.applicationCategory).toBe("DeveloperApplication");
    expect(j.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
  });
});

describe("buildArticleJsonLd", () => {
  it("emits BlogPosting with headline, date, author, url", () => {
    const j = buildArticleJsonLd({
      title: "UUIDv4 vs UUIDv7",
      description: "When to pick which.",
      slug: "uuidv4-vs-uuidv7",
      date: "2026-04-18",
      siteUrl: "https://drwho.me",
    });
    expect(j["@type"]).toBe("BlogPosting");
    expect(j.headline).toBe("UUIDv4 vs UUIDv7");
    expect(j.datePublished).toBe("2026-04-18");
    expect(j.url).toBe("https://drwho.me/blog/uuidv4-vs-uuidv7");
    expect(j.author).toEqual({ "@type": "Organization", name: "Hikmah Technologies" });
  });
});

describe("buildWebsiteJsonLd", () => {
  it("emits WebSite with name + url", () => {
    const j = buildWebsiteJsonLd({ siteUrl: "https://drwho.me" });
    expect(j["@type"]).toBe("WebSite");
    expect(j.url).toBe("https://drwho.me");
    expect(j.name).toBe("drwho.me");
  });
});
