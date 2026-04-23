import { findMcpTool } from "@/lib/mcp/tools";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

describe("dossier_full", () => {
  it("is registered in mcpTools", () => {
    expect(findMcpTool("dossier_full")).toBeDefined();
  });

  it("returns a JSON object keyed by every DossierCheckId", async () => {
    const tool = findMcpTool("dossier_full");
    if (!tool) throw new Error("dossier_full not registered");
    const r = await tool.handler({ domain: "example.com" });
    const text = r.content[0]?.type === "text" ? r.content[0].text : "";
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const ids = [
      "dns",
      "mx",
      "spf",
      "dmarc",
      "dkim",
      "tls",
      "redirects",
      "headers",
      "cors",
      "web-surface",
    ];
    for (const id of ids) {
      expect(parsed, `missing id ${id}`).toHaveProperty(id);
      const entry = parsed[id] as { status?: string };
      expect(typeof entry.status).toBe("string");
      expect(["ok", "timeout", "not_applicable", "error"]).toContain(entry.status);
    }
  }, 30_000);

  it("rejects denylisted domains like the per-check tools", async () => {
    const { DENYLIST } = await import("@/lib/dossier/denylist");
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST seed missing");
    const tool = findMcpTool("dossier_full");
    if (!tool) throw new Error("dossier_full not registered");
    const r = await tool.handler({ domain: entry });
    expect(r.isError).toBe(true);
  });
});
