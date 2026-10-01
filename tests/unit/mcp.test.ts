import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { callerId, clientLabel, clientVersionLabel } from "../../src/mcp/analytics";
import { glamaManifest, registryManifest } from "../../src/mcp/manifests";
import { mcpTools } from "../../src/mcp/tools";

const rpc = (body: unknown, headers: Record<string, string> = {}) =>
  app.request("http://drwho.me/mcp/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const INIT = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  },
};

describe("MCP endpoint", () => {
  // Directory health checks do exactly this. A redirect or an auth challenge here is what broke
  // the old listing.
  it("answers initialize with 200, no redirect and no auth", async () => {
    const res = await rpc(INIT);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { serverInfo: { name: string } } };
    expect(body.result.serverInfo.name).toBe("drwho.me");
  });

  it("lists every tool with a description and a schema", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const body = (await res.json()) as {
      result: { tools: { name: string; description: string; inputSchema: { type: string } }[] };
    };
    expect(body.result.tools.map((t) => t.name).sort()).toEqual(mcpTools.map((t) => t.name).sort());
    for (const t of body.result.tools) {
      expect(t.description.length).toBeGreaterThan(80);
      expect(t.inputSchema.type).toBe("object");
    }
  });

  it("runs a local tool", async () => {
    const res = await rpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "base64_encode", arguments: { text: "drwho" } },
    });
    const body = (await res.json()) as { result: { content: { text: string }[] } };
    expect(body.result.content[0]?.text).toBe("ZHJ3aG8=");
  });

  it("refuses a domain tool for an address or a private name without fetching", async () => {
    for (const domain of ["10.1.2.3", "localhost", "router.internal"]) {
      const res = await rpc({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "dossier_headers", arguments: { domain } },
      });
      const body = (await res.json()) as { result: { isError?: boolean } };
      expect(body.result.isError).toBe(true);
    }
  });

  it("meters tool calls per address but never tools/list", async () => {
    const who = { "cf-connecting-ip": "203.0.113.77" };
    const call = {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "uuid_generate", arguments: {} },
    };
    for (let i = 0; i < 60; i++) await rpc(call, who);
    const over = (await (await rpc(call, who)).json()) as {
      result: { isError?: boolean; content: { text: string }[] };
    };
    expect(over.result.isError).toBe(true);
    expect(over.result.content[0]?.text).toContain("Rate limit");
    expect((await rpc({ jsonrpc: "2.0", id: 6, method: "tools/list" }, who)).status).toBe(200);
  });

  it("does not hang on HEAD or GET", async () => {
    expect((await app.request("http://drwho.me/mcp/mcp", { method: "HEAD" })).status).toBe(200);
    expect((await app.request("http://drwho.me/mcp/mcp")).status).toBe(405);
  });
});

describe("MCP call analytics", () => {
  const call = {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: { name: "base64_encode", arguments: { text: "drwho" } },
  };
  const ua = { "user-agent": "claude-code/1.2.3 (cli)", "cf-connecting-ip": "203.0.113.90" };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // Each call has no session, so in the website's property every call counted as a new user (#11).
  it("never sends to the website's property", async () => {
    vi.stubEnv("GA_MEASUREMENT_ID", "G-WEB");
    vi.stubEnv("GA_API_SECRET", "web-secret");
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "");
    vi.stubEnv("GA_MCP_API_SECRET", "");
    const sent = vi.fn(async () => new Response(null));
    vi.stubGlobal("fetch", sent);
    await rpc(call, ua);
    expect(sent).not.toHaveBeenCalled();
  });

  it("sends to the MCP property with a coarse client label", async () => {
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "G-MCP");
    vi.stubEnv("GA_MCP_API_SECRET", "mcp-secret");
    const sent = vi.fn(async (_url: string, _init: RequestInit) => new Response(null));
    vi.stubGlobal("fetch", sent);
    await rpc(call, ua);
    expect(sent).toHaveBeenCalledOnce();
    const [url, init] = sent.mock.calls[0] ?? [];
    expect(url).toContain("measurement_id=G-MCP");
    const body = JSON.parse(String(init?.body));
    expect(body.events[0].name).toBe("mcp_tool_call");
    expect(body.events[0].params).toMatchObject({
      tool_name: "base64_encode",
      success: true,
      client_name: "claude-code",
      client_version: "1.2.3",
    });
    expect(body.client_id).toBe(callerId("203.0.113.90"));
    expect(String(init?.body)).not.toContain("203.0.113.90");
  });

  it("never sends the domain being checked", async () => {
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "G-MCP");
    vi.stubEnv("GA_MCP_API_SECRET", "mcp-secret");
    const sent = vi.fn(async (_url: string, _init: RequestInit) => new Response(null));
    vi.stubGlobal("fetch", sent);
    await rpc(
      {
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "dossier_headers", arguments: { domain: "secret-name.internal" } },
      },
      ua,
    );
    expect(sent).toHaveBeenCalledOnce();
    expect(String(sent.mock.calls[0]?.[1]?.body)).not.toContain("secret-name");
  });

  it("sends mcp_session_start on initialize with clientInfo name and version", async () => {
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "G-MCP");
    vi.stubEnv("GA_MCP_API_SECRET", "mcp-secret");
    const sent = vi.fn(async (_url: string, _init: RequestInit) => new Response(null));
    vi.stubGlobal("fetch", sent);
    const init = {
      ...INIT,
      params: { ...INIT.params, clientInfo: { name: "Cursor <x>", version: "1.7.2; drop" } },
    };
    expect((await rpc(init, ua)).status).toBe(200);
    expect(sent).toHaveBeenCalledOnce();
    const body = JSON.parse(String(sent.mock.calls[0]?.[1]?.body));
    expect(body.events[0]).toEqual({
      name: "mcp_session_start",
      params: {
        client_type: "mcp",
        client_name: "cursorx",
        client_version: "1.7.2drop",
      },
    });
    expect(body.client_id).toBe(callerId("203.0.113.90"));
  });

  it("does not send mcp_session_start for tools/list", async () => {
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "G-MCP");
    vi.stubEnv("GA_MCP_API_SECRET", "mcp-secret");
    const sent = vi.fn(async () => new Response(null));
    vi.stubGlobal("fetch", sent);
    await rpc({ jsonrpc: "2.0", id: 9, method: "tools/list" }, ua);
    expect(sent).not.toHaveBeenCalled();
  });

  it("never fails a request when analytics throws", async () => {
    vi.stubEnv("GA_MCP_MEASUREMENT_ID", "G-MCP");
    vi.stubEnv("GA_MCP_API_SECRET", "mcp-secret");
    vi.stubGlobal("fetch", () => {
      throw new Error("boom");
    });
    expect((await rpc(INIT, ua)).status).toBe(200);
    const res = await rpc(call, ua);
    const body = (await res.json()) as { result: { content: { text: string }[] } };
    expect(body.result.content[0]?.text).toBe("ZHJ3aG8=");
  });

  it("takes the version from clientInfo, else from the User-Agent product", () => {
    expect(clientVersionLabel({ name: "cursor", version: "1.7.2" }, "node")).toBe("1.7.2");
    expect(clientVersionLabel(undefined, "claude-code/2.0.1 (cli)")).toBe("2.0.1");
    expect(clientVersionLabel(undefined, "curl")).toBe("unknown");
    expect(clientVersionLabel({ name: "x", version: "9".repeat(100) }, null)).toHaveLength(24);
  });

  it("labels the client by clientInfo first, then the User-Agent product", () => {
    expect(clientLabel("Cursor", "node")).toBe("cursor");
    expect(clientLabel(undefined, "Claude-User/1.0 (+https://x)")).toBe("claude-user");
    expect(clientLabel(undefined, null)).toBe("unknown");
    expect(clientLabel("<script>", null)).toBe("script");
  });
});

describe("MCP caller id", () => {
  afterEach(() => vi.unstubAllEnvs());
  const day1 = new Date("2026-09-21T01:00:00Z");
  const day1late = new Date("2026-09-21T23:59:00Z");
  const day2 = new Date("2026-09-22T00:00:01Z");

  it("is stable for one address within a UTC day", () => {
    expect(callerId("198.51.100.4", day1)).toBe(callerId("198.51.100.4", day1late));
  });

  it("changes at the day boundary and between addresses", () => {
    expect(callerId("198.51.100.4", day1)).not.toBe(callerId("198.51.100.4", day2));
    expect(callerId("198.51.100.4", day1)).not.toBe(callerId("198.51.100.5", day1));
  });

  it("depends on the server secret and never contains the address", () => {
    vi.stubEnv("MCP_CALLER_SALT", "one");
    const a = callerId("198.51.100.4", day1);
    vi.stubEnv("MCP_CALLER_SALT", "two");
    const b = callerId("198.51.100.4", day1);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain("198");
  });

  it("is random per call when there is no address", () => {
    expect(callerId(null, day1)).not.toBe(callerId(null, day1));
  });
});

describe("tool list", () => {
  it("has unique snake_case names", () => {
    const names = mcpTools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("never offers the paid aggregate or the active probe", () => {
    const names = mcpTools.map((t) => t.name);
    expect(names).not.toContain("dossier_full");
    expect(names.some((n) => n.includes("exposed"))).toBe(false);
  });
});

describe("manifests", () => {
  // The old listing's manifest drifted from the server for months. These files are generated
  // (pnpm manifests); this fails when someone forgets to regenerate them.
  it("committed glama.json and server.json match the code", () => {
    expect(JSON.parse(readFileSync("glama.json", "utf8"))).toEqual(glamaManifest());
    expect(JSON.parse(readFileSync("server.json", "utf8"))).toEqual(registryManifest());
  });

  it("points at the endpoint that must not redirect", () => {
    expect(registryManifest().remotes[0]?.url).toBe("https://drwho.me/mcp/mcp");
  });
});
