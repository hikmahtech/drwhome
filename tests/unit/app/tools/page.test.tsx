import ToolsHub from "@/app/tools/page";
import { tools } from "@/content/tools";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ToolsHub", () => {
  it("lists every tool by name", () => {
    render(<ToolsHub />);
    for (const t of tools) {
      expect(screen.getByText(t.name, { exact: false })).toBeDefined();
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
