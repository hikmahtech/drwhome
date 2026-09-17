import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app";
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
