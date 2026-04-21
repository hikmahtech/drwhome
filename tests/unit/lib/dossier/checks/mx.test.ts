import { mxCheck } from "@/lib/dossier/checks/mx";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("mxCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns error for invalid domain", async () => {
    const r = await mxCheck("not a domain");
    expect(r.status).toBe("error");
  });

  it("returns ok with sorted MX records", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 15, TTL: 300, data: "20 backup.example.com." },
          { name: "example.com.", type: 15, TTL: 300, data: "10 primary.example.com." },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.records).toEqual([
        { priority: 10, exchange: "primary.example.com." },
        { priority: 20, exchange: "backup.example.com." },
      ]);
    }
  });

  it("returns not_applicable when no MX records", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("not_applicable");
  });

  it("returns error when DoH upstream fails", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 502 } as Response) as unknown as typeof fetch;
    const r = await mxCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout on hanging fetch", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    const r = await mxCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 200);

  it("skips malformed MX rdata without failing the whole check", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 15, TTL: 300, data: "10 primary.example.com." },
          { name: "example.com.", type: 15, TTL: 300, data: "garbage" },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.records).toEqual([{ priority: 10, exchange: "primary.example.com." }]);
    }
  });
});
