import { CorsSection } from "@/components/dossier/sections/CorsSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/cors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dossier/checks/cors")>(
    "@/lib/dossier/checks/cors",
  );
  return { ...actual, corsCheck: vi.fn() };
});
import { corsCheck } from "@/lib/dossier/checks/cors";

describe("CorsSection", () => {
  it("renders origin, method, preflight status, and AC-* headers on ok", async () => {
    (corsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        origin: "https://drwho.me",
        method: "GET",
        preflightStatus: 204,
        allowOrigin: "*",
        allowMethods: "GET,POST",
        maxAge: "600",
        anyAcHeader: true,
      },
    });
    const ui = await CorsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText("https://drwho.me")).toBeInTheDocument();
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("204")).toBeInTheDocument();
    expect(screen.getByText("access-control-allow-origin")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("GET,POST")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    // missing AC-* header renders em dash
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("shows the no-CORS muted note when anyAcHeader is false", async () => {
    (corsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        origin: "https://drwho.me",
        method: "GET",
        preflightStatus: 405,
        anyAcHeader: false,
      },
    });
    const ui = await CorsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no access-control-\* headers returned/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (corsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "ECONNREFUSED",
    });
    const ui = await CorsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (corsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await CorsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
