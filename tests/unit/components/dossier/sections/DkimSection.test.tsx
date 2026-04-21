import { DkimSection } from "@/components/dossier/sections/DkimSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dossier/checks/dkim", () => ({ dkimCheck: vi.fn() }));
import { dkimCheck } from "@/lib/dossier/checks/dkim";

describe("DkimSection", () => {
  it("renders each probed selector on ok", async () => {
    (dkimCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        selectors: [
          { selector: "default", status: "not_found" },
          { selector: "google", status: "found", record: "v=DKIM1; k=rsa; p=ABCDEF" },
        ],
      },
    });
    const ui = await DkimSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText("default:")).toBeInTheDocument();
    expect(screen.getByText("google:")).toBeInTheDocument();
    expect(screen.getByText(/v=DKIM1; k=rsa; p=ABCDEF/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders not_applicable reason", async () => {
    (dkimCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no DKIM record on probed selectors (default, google)",
    });
    const ui = await DkimSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no DKIM record on probed selectors/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (dkimCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await DkimSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (dkimCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "timeout",
      ms: 5000,
    });
    const ui = await DkimSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
