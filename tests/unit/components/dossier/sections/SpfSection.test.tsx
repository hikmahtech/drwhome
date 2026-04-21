import { SpfSection } from "@/components/dossier/sections/SpfSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/spf", () => ({ spfCheck: vi.fn() }));
import { spfCheck } from "@/lib/dossier/checks/spf";

describe("SpfSection", () => {
  it("renders record and mechanisms on ok", async () => {
    (spfCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        record: "v=spf1 include:_spf.google.com ~all",
        mechanisms: ["v=spf1", "include:_spf.google.com", "~all"],
      },
    });
    const ui = await SpfSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/v=spf1 include:_spf\.google\.com ~all/)).toBeInTheDocument();
    expect(screen.getByText(/^~all$/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders not_applicable reason", async () => {
    (spfCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no SPF record",
    });
    const ui = await SpfSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no SPF record/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (spfCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await SpfSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (spfCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await SpfSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
