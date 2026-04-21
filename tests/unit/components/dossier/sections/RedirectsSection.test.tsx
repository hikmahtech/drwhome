import { RedirectsSection } from "@/components/dossier/sections/RedirectsSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/redirects", () => ({ redirectsCheck: vi.fn() }));
import { redirectsCheck } from "@/lib/dossier/checks/redirects";

describe("RedirectsSection", () => {
  it("renders the hop chain on ok", async () => {
    (redirectsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        hops: [
          { url: "https://example.com/", status: 301 },
          { url: "https://www.example.com/", status: 302 },
          { url: "https://www.example.com/final", status: 200 },
        ],
        finalStatus: 200,
      },
    });
    const ui = await RedirectsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/final status:/)).toBeInTheDocument();
    expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
    expect(screen.getByText(/https:\/\/example\.com\//)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/www\.example\.com\/final/)).toBeInTheDocument();
    expect(screen.getByText(/\[301\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[302\]/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (redirectsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "redirect cap exceeded (10)",
    });
    const ui = await RedirectsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/cap exceeded/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (redirectsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await RedirectsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
