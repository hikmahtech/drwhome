import { resolveDns } from "@/lib/tools/dns";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveDns", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain names", async () => {
    const r = await resolveDns("", "A");
    expect(r.ok).toBe(false);
  });

  it("rejects unsupported record types", async () => {
    const r = await resolveDns("example.com", "BOGUS" as unknown as "A");
    expect(r.ok).toBe(false);
  });

  it("returns parsed answers on valid response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" }],
      }),
    }) as unknown as typeof fetch;
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toHaveLength(1);
      expect(r.answers[0].data).toBe("93.184.216.34");
    }
  });

  it("returns error when upstream fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(false);
  });
});
