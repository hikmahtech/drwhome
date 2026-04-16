import { lookupIp } from "@/lib/tools/ipLookup";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("lookupIp", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects obviously invalid IPs without calling the API", async () => {
    const spy = vi.fn();
    global.fetch = spy as unknown as typeof fetch;
    const r = await lookupIp("not-an-ip", "test-token");
    expect(r.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns parsed data on 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ip: "8.8.8.8",
        city: "Mountain View",
        region: "California",
        country: "US",
        loc: "37.4056,-122.0775",
        org: "AS15169 Google LLC",
        timezone: "America/Los_Angeles",
      }),
    }) as unknown as typeof fetch;
    const r = await lookupIp("8.8.8.8", "test-token");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.ip).toBe("8.8.8.8");
      expect(r.data.city).toBe("Mountain View");
      expect(r.data.org).toContain("Google");
    }
  });

  it("returns error on non-ok fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;
    const r = await lookupIp("8.8.8.8", "test-token");
    expect(r.ok).toBe(false);
  });

  it("errors without a token", async () => {
    const r = await lookupIp("8.8.8.8", "");
    expect(r.ok).toBe(false);
  });
});
