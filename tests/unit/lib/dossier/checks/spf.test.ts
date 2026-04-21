import { spfCheck } from "@/lib/dossier/checks/spf";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("spfCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await spfCheck("nope")).status).toBe("error");
  });

  it("returns ok with the spf record concatenated from quoted segments", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          {
            name: "example.com.",
            type: 16,
            TTL: 300,
            data: '"v=spf1 include:_spf.google.com " "-all"',
          },
          { name: "example.com.", type: 16, TTL: 300, data: '"unrelated=foo"' },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await spfCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.record).toBe("v=spf1 include:_spf.google.com -all");
      expect(r.data.mechanisms).toEqual(["v=spf1", "include:_spf.google.com", "-all"]);
    }
  });

  it("returns not_applicable when no spf record", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "example.com.", type: 16, TTL: 300, data: '"unrelated=foo"' }],
      }),
    }) as unknown as typeof fetch;
    expect((await spfCheck("example.com")).status).toBe("not_applicable");
  });

  it("returns error when multiple spf records found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 16, TTL: 300, data: '"v=spf1 -all"' },
          { name: "example.com.", type: 16, TTL: 300, data: '"v=spf1 +all"' },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await spfCheck("example.com");
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toMatch(/multiple/i);
  });

  it("returns timeout on hanging fetch", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    const r = await spfCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 200);
});
