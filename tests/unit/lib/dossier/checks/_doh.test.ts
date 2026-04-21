import { dohFetch } from "@/lib/dossier/checks/_doh";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("dohFetch", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns answers on upstream ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 16, TTL: 60, data: '"v=spf1 -all"' },
          { name: "example.com.", type: 16, TTL: 60, data: '"another"' },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toHaveLength(2);
      expect(r.answers[0].data).toBe('"v=spf1 -all"');
    }
  });

  it("returns ok with empty answers on NOERROR plus no Answer key", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0 }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.answers).toEqual([]);
  });

  it("returns not-ok on non-200 upstream", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/500/);
  });

  it("returns not-ok on non-zero DoH Status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 3 }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("nope.example", "TXT");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/status 3/i);
  });
});
