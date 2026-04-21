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

  it("dossier_headers returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: "https://example.com/",
      headers: new Headers({
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Type": "text/html",
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_headers");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
    expect(parsed.data.headers["strict-transport-security"]).toBe("max-age=31536000");
  });

  it("dossier_cors returns CheckResult ok with AC-* headers on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST",
      }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_cors");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
    expect(parsed.data.allowOrigin).toBe("*");
    expect(parsed.data.anyAcHeader).toBe(true);
    expect(parsed.data.origin).toBe("https://drwho.me");
    expect(parsed.data.method).toBe("GET");
  });

  it("dossier_cors forwards optional origin and method inputs", async () => {
    let captured: Record<string, string> | undefined;
    global.fetch = vi.fn((_url: string, opts: { headers?: Record<string, string> }) => {
      captured = opts?.headers;
      return Promise.resolve({
        ok: true,
        status: 204,
        headers: new Headers(),
      } as unknown as Response);
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_cors");
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({
      domain: "example.com",
      origin: "https://app.example.com",
      method: "put",
    });
    expect(r.isError).toBeFalsy();
    expect(captured?.Origin).toBe("https://app.example.com");
    expect(captured?.["Access-Control-Request-Method"]).toBe("PUT");
  });

  it("dossier_web_surface returns CheckResult ok on success", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const body = url.endsWith("/robots.txt")
        ? "User-agent: *"
        : url.endsWith("/sitemap.xml")
          ? "<urlset><url><loc>/a</loc></url></urlset>"
          : "<html><head><title>T</title></head></html>";
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => body,
      } as unknown as Response;
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_web_surface");
    expect(tool).toBeDefined();
    if (!tool) throw new Error("tool missing");
    const r = await tool.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
    expect(parsed.data.robots.present).toBe(true);
    expect(parsed.data.sitemap.urlCount).toBe(1);
    expect(parsed.data.head.title).toBe("T");
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
