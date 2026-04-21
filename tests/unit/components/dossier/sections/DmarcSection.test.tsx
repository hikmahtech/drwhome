import { DmarcSection } from "@/components/dossier/sections/DmarcSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/dmarc", () => ({ dmarcCheck: vi.fn() }));
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";

describe("DmarcSection", () => {
  it("renders record and tags on ok", async () => {
    (dmarcCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        record: "v=DMARC1; p=quarantine; rua=mailto:reports@example.com",
        tags: {
          v: "DMARC1",
          p: "quarantine",
          rua: "mailto:reports@example.com",
        },
      },
    });
    const ui = await DmarcSection({ domain: "example.com" });
    render(ui);
    expect(
      screen.getByText(/v=DMARC1; p=quarantine; rua=mailto:reports@example\.com/),
    ).toBeInTheDocument();
    expect(screen.getByText("p=")).toBeInTheDocument();
    expect(screen.getByText("quarantine")).toBeInTheDocument();
    expect(screen.getByText("rua=")).toBeInTheDocument();
    expect(screen.getByText("mailto:reports@example.com")).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders not_applicable reason", async () => {
    (dmarcCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no DMARC record",
    });
    const ui = await DmarcSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no DMARC record/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (dmarcCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await DmarcSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (dmarcCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await DmarcSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
