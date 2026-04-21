import { afterEach, describe, expect, it, vi } from "vitest";

describe("mcp dossier_dns", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns a CheckResult ok payload for a happy domain", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "example.com.", type: 1, TTL: 60, data: "1.1.1.1" }],
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dns");
    if (!tool) throw new Error("dossier_dns tool not registered");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("returns CheckResult error for invalid domain without isError", async () => {
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dns");
    if (!tool) throw new Error("dossier_dns tool not registered");
    const r = await tool.handler({ domain: "not a domain" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("error");
  });
});
