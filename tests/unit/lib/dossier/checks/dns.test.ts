import { DNS_DOSSIER_TYPES, dnsCheck } from "@/lib/dossier/checks/dns";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("dnsCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns error for invalid domain", async () => {
    const r = await dnsCheck("not a domain");
    expect(r.status).toBe("error");
  });

  it("aggregates answers across record types on success", async () => {
    const fixture = (type: string) =>
      ({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ name: "example.com.", type: 1, TTL: 60, data: `stub-${type}` }],
        }),
      }) as unknown as Response;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const t = new URL(url).searchParams.get("type") ?? "unknown";
      return fixture(t);
    }) as unknown as typeof fetch;

    const r = await dnsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(Object.keys(r.data.records).sort()).toEqual([...DNS_DOSSIER_TYPES].sort());
      for (const t of DNS_DOSSIER_TYPES) {
        expect(r.data.records[t]).toHaveLength(1);
      }
      expect(r.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("returns not_applicable when domain has zero answers across all types", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;
    const r = await dnsCheck("example.com");
    expect(r.status).toBe("not_applicable");
  });

  it("returns error when upstream DoH returns non-200", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    const r = await dnsCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout when a fetch hangs past the timeout", async () => {
    global.fetch = vi.fn((url: string, opts: any) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    const r = await dnsCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 200);
});
