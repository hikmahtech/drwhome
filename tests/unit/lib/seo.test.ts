import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildHowToJsonLd,
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

describe("buildFaqJsonLd", () => {
  it("emits FAQPage with Question/Answer entries", () => {
    const j = buildFaqJsonLd([
      { q: "what is base64?", a: "a binary-to-text encoding using 64 ascii chars." },
      { q: "is it encryption?", a: "no. it is reversible encoding with no key." },
    ]);
    expect(j["@type"]).toBe("FAQPage");
    const main = j.mainEntity as unknown as Array<Record<string, unknown>>;
    expect(main).toHaveLength(2);
    expect(main[0]["@type"]).toBe("Question");
    expect(main[0].name).toBe("what is base64?");
    expect((main[0].acceptedAnswer as Record<string, unknown>)["@type"]).toBe("Answer");
    expect((main[0].acceptedAnswer as Record<string, unknown>).text).toBe(
      "a binary-to-text encoding using 64 ascii chars.",
    );
  });

  it("handles an empty faq list", () => {
    const j = buildFaqJsonLd([]);
    expect(j.mainEntity).toEqual([]);
  });
});

describe("buildHowToJsonLd", () => {
  it("emits HowTo with positioned steps", () => {
    const j = buildHowToJsonLd({
      name: "decode a base64 string",
      description: "paste and click decode.",
      steps: [
        { step: "paste input", detail: "paste the base64 string into the input field." },
        { step: "click decode", detail: "click the decode button to see the plaintext." },
      ],
    });
    expect(j["@type"]).toBe("HowTo");
    expect(j.name).toBe("decode a base64 string");
    const steps = j.step as unknown as Array<Record<string, unknown>>;
    expect(steps).toHaveLength(2);
    expect(steps[0].position).toBe(1);
    expect(steps[0].name).toBe("paste input");
    expect(steps[1].position).toBe(2);
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("emits BreadcrumbList with absolute item URLs", () => {
    const j = buildBreadcrumbJsonLd({
      crumbs: [
        { name: "home", path: "/" },
        { name: "tools", path: "/tools" },
        { name: "jwt", path: "/tools/jwt" },
      ],
      siteUrl: "https://drwho.me",
    });
    expect(j["@type"]).toBe("BreadcrumbList");
    const items = j.itemListElement as unknown as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[0].item).toBe("https://drwho.me/");
    expect(items[2].item).toBe("https://drwho.me/tools/jwt");
  });
});
