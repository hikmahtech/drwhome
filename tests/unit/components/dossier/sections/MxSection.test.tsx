import { MxSection } from "@/components/dossier/sections/MxSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/mx", () => ({ mxCheck: vi.fn() }));
import { mxCheck } from "@/lib/dossier/checks/mx";

describe("MxSection", () => {
  it("renders sorted records on ok", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        records: [
          { priority: 10, exchange: "primary.example.com." },
          { priority: 20, exchange: "backup.example.com." },
        ],
      },
    });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/primary\.example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/backup\.example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders not_applicable reason", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no MX records",
    });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no MX records/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
