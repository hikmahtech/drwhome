import { JsonLd } from "@/components/seo/JsonLd";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json and serialized JSON", () => {
    const { container } = render(
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "drwho.me",
        }}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const parsed = JSON.parse(script?.textContent ?? "{}");
    expect(parsed["@type"]).toBe("WebSite");
    expect(parsed.name).toBe("drwho.me");
  });

  it("escapes the </script> sequence to prevent injection", () => {
    const { container } = render(
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Thing",
          name: "</script><img>",
        }}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const raw = script?.innerHTML ?? "";
    expect(raw).not.toContain("</script>");
    expect(raw).toContain("\\u003c/script>");
  });
});
