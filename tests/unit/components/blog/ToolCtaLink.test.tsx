import { ToolCtaLink } from "@/components/blog/ToolCtaLink";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("ToolCtaLink", () => {
  it("links to /tools/<slug>", () => {
    render(
      <ToolCtaLink postSlug="what-is-dmarc" toolSlug="dmarc-checker">
        check now →
      </ToolCtaLink>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tools/dmarc-checker");
  });

  it("fires blog_tool_click on click", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(
      <ToolCtaLink postSlug="what-is-dmarc" toolSlug="dmarc-checker">
        check now →
      </ToolCtaLink>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(gtag).toHaveBeenCalledWith("event", "blog_tool_click", {
      post_slug: "what-is-dmarc",
      tool_slug: "dmarc-checker",
    });
  });
});
