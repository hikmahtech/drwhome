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

  it("dossier_mx returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "example.com.", type: 15, TTL: 300, data: "10 mail.example.com." }],
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_mx");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("dossier_spf returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          {
            name: "example.com.",
            type: 16,
            TTL: 300,
            data: '"v=spf1 include:_spf.google.com ~all"',
          },
        ],
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_spf");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("dossier_dkim returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const name = new URL(url).searchParams.get("name") ?? "";
      const isGoogle = name.startsWith("google._domainkey.");
      return {
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: isGoogle ? [{ name, type: 16, TTL: 60, data: '"v=DKIM1; k=rsa; p=ABC"' }] : [],
        }),
      };
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dkim");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("dossier_tls returns CheckResult error for invalid domain", async () => {
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_tls");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "not a domain" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("error");
  });

  it("dossier_redirects returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_redirects");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("dossier_dmarc returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          {
            name: "_dmarc.example.com.",
            type: 16,
            TTL: 300,
            data: '"v=DMARC1; p=quarantine; rua=mailto:reports@example.com"',
          },
        ],
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dmarc");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });
});
