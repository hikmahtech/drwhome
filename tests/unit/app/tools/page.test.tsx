import ToolsHub from "@/app/tools/page";
import { tools } from "@/content/tools";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ToolsHub", () => {
  it("renders a link to every tool by slug", () => {
    render(<ToolsHub />);
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    for (const t of tools) {
      expect(hrefs).toContain(`/tools/${t.slug}`);
    }
  });

  it("features the domain dossier with a link to /domain-dossier", () => {
    render(<ToolsHub />);
    const featured = screen.getByRole("link", { name: /domain dossier/i });
    expect(featured.getAttribute("href")).toBe("/domain-dossier");
  });

  it("groups tools by category", () => {
    render(<ToolsHub />);
    expect(screen.getByText(/network/i, { selector: "h2" })).toBeDefined();
    expect(screen.getByText(/dev/i, { selector: "h2" })).toBeDefined();
  });
});
