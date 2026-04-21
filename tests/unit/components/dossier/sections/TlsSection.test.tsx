import { TlsSection } from "@/components/dossier/sections/TlsSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/tls", () => ({ tlsCheck: vi.fn() }));
import { tlsCheck } from "@/lib/dossier/checks/tls";

describe("TlsSection", () => {
  it("renders cert fields on ok (authorized)", async () => {
    (tlsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        subject: { CN: "example.com" },
        issuer: { CN: "Some CA", O: "Some CA Inc" },
        validFrom: "Jan  1 00:00:00 2026 GMT",
        validTo: "Jan  1 00:00:00 2027 GMT",
        sans: ["example.com", "www.example.com"],
        fingerprint256: "AA:BB:CC",
        authorized: true,
      },
    });
    const ui = await TlsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getAllByText(/example.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Some CA \/ Some CA Inc/)).toBeInTheDocument();
    expect(screen.getByText(/AA:BB:CC/)).toBeInTheDocument();
    expect(screen.getByText("www.example.com")).toBeInTheDocument();
    expect(screen.getByText("yes")).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders auth error on ok with authorized=false", async () => {
    (tlsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        subject: { CN: "expired.example.com" },
        issuer: { CN: "Some CA", O: "Some CA Inc" },
        validFrom: "Jan  1 00:00:00 2020 GMT",
        validTo: "Jan  1 00:00:00 2021 GMT",
        sans: [],
        authorized: false,
        authorizationError: "CERT_HAS_EXPIRED",
      },
    });
    const ui = await TlsSection({ domain: "expired.example.com" });
    render(ui);
    expect(screen.getByText(/CERT_HAS_EXPIRED/)).toBeInTheDocument();
    expect(screen.getByText(/no/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (tlsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "ECONNREFUSED",
    });
    const ui = await TlsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (tlsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await TlsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
