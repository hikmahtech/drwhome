import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckSection } from "@/components/dossier/CheckSection";

describe("CheckSection", () => {
  it("renders title, status badge, and children", () => {
    render(
      <CheckSection title="dns" toolSlug="dossier-dns" domain="example.com" status="ok" fetchedAt="2026-04-21T00:00:00Z">
        <div>body</div>
      </CheckSection>,
    );
    expect(screen.getByText("dns")).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /open standalone/i });
    expect(link).toHaveAttribute("href", "/tools/dossier-dns?domain=example.com");
  });

  it("does not render fetchedAt when missing", () => {
    render(
      <CheckSection title="dns" toolSlug="dossier-dns" domain="example.com" status="timeout">
        <div>body</div>
      </CheckSection>,
    );
    expect(screen.queryByText(/fetched/i)).not.toBeInTheDocument();
  });
});
