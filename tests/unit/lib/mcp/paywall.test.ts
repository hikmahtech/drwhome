import { withPaywall } from "@/lib/mcp/paywall";
import { describe, expect, it, vi } from "vitest";

function jsonRequest(body: unknown): Request {
  return new Request("https://drwho.me/mcp/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("withPaywall", () => {
  it("short-circuits tools/call with 402 + JSON-RPC -32001", async () => {
    const inner = vi.fn(async () => new Response("should not run", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      id: 42,
      method: "tools/call",
      params: { name: "uuid_generate", arguments: {} },
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(42);
    expect(body.error.code).toBe(-32001);
    expect(body.error.message).toMatch(/subscription/i);
    expect(body.error.data).toEqual({ upgradeUrl: "https://drwho.me/mcp", tier: "paid" });
    expect(inner).not.toHaveBeenCalled();
  });

  it("forwards tools/list to the inner handler", async () => {
    const innerRes = new Response(
      JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    const inner = vi.fn(async () => innerRes);
    const wrapped = withPaywall(inner);
    const req = jsonRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res).toBe(innerRes);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards initialize to the inner handler", async () => {
    const inner = vi.fn(async () => new Response("{}", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards non-POST requests untouched", async () => {
    const inner = vi.fn(async () => new Response("ok", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = new Request("https://drwho.me/mcp/mcp", { method: "GET" });

    await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards a non-JSON POST untouched (body peek fails gracefully)", async () => {
    const inner = vi.fn(async () => new Response("ok", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = new Request("https://drwho.me/mcp/mcp", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("inner handler still receives a readable body after the paywall peek", async () => {
    const inner = vi.fn(async (req: Request) => {
      const parsed = await req.json();
      return new Response(JSON.stringify(parsed), { status: 200 });
    });
    const wrapped = withPaywall(inner);
    const req = jsonRequest({ jsonrpc: "2.0", id: 7, method: "tools/list" });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });
    const body = await res.json();

    expect(body.method).toBe("tools/list");
    expect(body.id).toBe(7);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("uses null for id when the request omits it (notification-shaped)", async () => {
    const inner = vi.fn();
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "x", arguments: {} },
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });
    const body = await res.json();
    expect(body.id).toBeNull();
  });
});
