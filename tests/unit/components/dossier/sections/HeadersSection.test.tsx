import { HeadersSection } from "@/components/dossier/sections/HeadersSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/headers", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dossier/checks/headers")>(
    "@/lib/dossier/checks/headers",
  );
  return { ...actual, headersCheck: vi.fn() };
});
import { headersCheck } from "@/lib/dossier/checks/headers";

describe("HeadersSection", () => {
  it("renders security headers and other headers on ok", async () => {
    (headersCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        finalUrl: "https://example.com/",
        headers: {
          "strict-transport-security": "max-age=31536000",
          "content-security-policy": "default-src 'self'",
          "content-type": "text/html",
          server: "nginx",
        },
      },
    });
    const ui = await HeadersSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/final url:/)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/example\.com\//)).toBeInTheDocument();
    expect(screen.getByText("strict-transport-security")).toBeInTheDocument();
    expect(screen.getByText("max-age=31536000")).toBeInTheDocument();
    expect(screen.getByText("content-security-policy")).toBeInTheDocument();
    // missing security header shows em dash
    expect(screen.getByText("x-frame-options")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    // other headers section
    expect(screen.getByText("server")).toBeInTheDocument();
    expect(screen.getByText("nginx")).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (headersCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "ECONNREFUSED",
    });
    const ui = await HeadersSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (headersCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await HeadersSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
