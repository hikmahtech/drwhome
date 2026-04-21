import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DnsSection } from "@/components/dossier/sections/DnsSection";

vi.mock("@/lib/dossier/checks/dns", () => ({
  DNS_DOSSIER_TYPES: ["A", "AAAA", "NS", "SOA", "CAA", "TXT"],
  dnsCheck: vi.fn(),
}));
import { dnsCheck } from "@/lib/dossier/checks/dns";

describe("DnsSection", () => {
  it("renders record rows on ok", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-21T00:00:00Z",
      data: {
        records: {
          A: [{ name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" }],
          AAAA: [], NS: [], SOA: [], CAA: [], TXT: [],
        },
      },
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/93\.184\.216\.34/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders error message on error", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    expect(screen.getByText(/error/)).toBeInTheDocument();
  });

  it("renders no-records line on not_applicable", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no DNS records found",
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no DNS records found/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "timeout", ms: 5000 });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
