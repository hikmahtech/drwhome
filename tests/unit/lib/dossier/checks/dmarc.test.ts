import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("dmarcCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await dmarcCheck("nope")).status).toBe("error");
  });

  it("returns ok with parsed tags on happy path", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          {
            name: "_dmarc.example.com.",
            type: 16,
            TTL: 300,
            data: '"v=DMARC1; p=quarantine; rua=mailto:reports@example.com; adkim=s"',
          },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await dmarcCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.record).toBe("v=DMARC1; p=quarantine; rua=mailto:reports@example.com; adkim=s");
      expect(r.data.tags.p).toBe("quarantine");
      expect(r.data.tags.rua).toBe("mailto:reports@example.com");
      expect(r.data.tags.adkim).toBe("s");
    }
  });

  it("returns not_applicable when no dmarc record", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "_dmarc.example.com.", type: 16, TTL: 300, data: '"unrelated=foo"' }],
      }),
    }) as unknown as typeof fetch;
    expect((await dmarcCheck("example.com")).status).toBe("not_applicable");
  });

  it("returns error when multiple dmarc records found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "_dmarc.example.com.", type: 16, TTL: 300, data: '"v=DMARC1; p=none"' },
          { name: "_dmarc.example.com.", type: 16, TTL: 300, data: '"v=DMARC1; p=reject"' },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await dmarcCheck("example.com");
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
    const r = await dmarcCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 200);
});
