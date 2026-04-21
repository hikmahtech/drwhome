import { WebSurfaceSection } from "@/components/dossier/sections/WebSurfaceSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/web-surface", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dossier/checks/web-surface")>(
    "@/lib/dossier/checks/web-surface",
  );
  return { ...actual, webSurfaceCheck: vi.fn() };
});
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";

describe("WebSurfaceSection", () => {
  it("renders all four sub-blocks on ok", async () => {
    (webSurfaceCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        robots: { present: true, body: "User-agent: *\nDisallow: /admin" },
        sitemap: { present: true, urlCount: 3 },
        head: {
          title: "Example",
          description: "An example site.",
          og: { "og:title": "Example OG", "og:image": "https://example.com/og.png" },
          twitter: { "twitter:card": "summary_large_image" },
        },
      },
    });
    const ui = await WebSurfaceSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText("present")).toBeInTheDocument();
    expect(screen.getByText(/3 url\(s\)/)).toBeInTheDocument();
    expect(screen.getByText("Example")).toBeInTheDocument();
    expect(screen.getByText("An example site.")).toBeInTheDocument();
    expect(screen.getByText("og:title")).toBeInTheDocument();
    expect(screen.getByText("Example OG")).toBeInTheDocument();
    expect(screen.getByText("twitter:card")).toBeInTheDocument();
    expect(screen.getByText("summary_large_image")).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders absent labels when robots+sitemap missing and no social tags", async () => {
    (webSurfaceCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        robots: { present: false },
        sitemap: { present: false },
        head: { og: {}, twitter: {} },
      },
    });
    const ui = await WebSurfaceSection({ domain: "example.com" });
    render(ui);
    expect(screen.getAllByText("absent").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/no OpenGraph or Twitter meta tags found/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (webSurfaceCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "ECONNREFUSED",
    });
    const ui = await WebSurfaceSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (webSurfaceCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await WebSurfaceSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
