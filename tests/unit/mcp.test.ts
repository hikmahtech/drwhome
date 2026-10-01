import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../src/app";
import { clientLabel } from "../../src/mcp/analytics";
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

  // Glama's hourly check (#8) is a bare client: initialize, notifications/initialized, tools/list,
  // with no session id, no cookie, no Origin and often no browser User-Agent. Every variant here
  // must get through; a newer SDK that insists on the Accept header would break the listing.
  it("lets a bare directory health check through: initialize, initialized, tools/list", async () => {
    const bare = (body: unknown, headers: Record<string, string>) =>
      app.request("http://drwho.me/mcp/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
    const variants: Record<string, string>[] = [
      { accept: "application/json, text/event-stream" },
      {},
      { accept: "application/json, text/event-stream", "user-agent": "node" },
      { accept: "*/*", "user-agent": "python-httpx/0.27.0" },
    ];
    for (const headers of variants) {
      const init = await bare(
        { ...INIT, params: { ...INIT.params, protocolVersion: "2025-11-25" } },
        headers,
      );
      expect(init.status).toBe(200);
      expect(init.headers.get("location")).toBeNull();
      expect(init.headers.get("www-authenticate")).toBeNull();
      const sid = init.headers.get("mcp-session-id");
      const withSid = sid ? { ...headers, "mcp-session-id": sid } : headers;
      const note = await bare({ jsonrpc: "2.0", method: "notifications/initialized" }, withSid);
      expect(note.status).toBe(202);
      const list = await bare({ jsonrpc: "2.0", id: 2, method: "tools/list" }, withSid);
      expect(list.status).toBe(200);
      const body = (await list.json()) as { result: { tools: unknown[] } };
      expect(body.result.tools).toHaveLength(mcpTools.length);
    }
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
    expect(body.events[0].params).toMatchObject({
      tool_name: "base64_encode",
      client_name: "claude-code",
    });
    expect(String(init?.body)).not.toContain("203.0.113.90");
  });

  it("labels the client by clientInfo first, then the User-Agent product", () => {
    expect(clientLabel("Cursor", "node")).toBe("cursor");
    expect(clientLabel(undefined, "Claude-User/1.0 (+https://x)")).toBe("claude-user");
    expect(clientLabel(undefined, null)).toBe("unknown");
    expect(clientLabel("<script>", null)).toBe("script");
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
