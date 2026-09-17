import { afterEach, describe, expect, it, vi } from "vitest";
import { DNS_TYPES, resolveDns } from "../../src/lib/dns";

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  );
}

describe("DNS_TYPES", () => {
  it("lists the nine supported record types", () => {
    expect(DNS_TYPES).toEqual(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA", "SRV"]);
  });
});

describe("resolveDns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects an invalid domain name without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await resolveDns("not a domain!!", "A");
    expect(r.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an unsupported record type without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    // @ts-expect-error intentionally invalid for the test
    const r = await resolveDns("example.com", "PTR");
    expect(r.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps answers to mnemonic types on a NOERROR response", async () => {
    mockFetch({
      Status: 0,
      Answer: [{ name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" }],
    });
    const r = await resolveDns("example.com", "A");
    expect(r).toEqual({
      ok: true,
      answers: [{ name: "example.com.", type: "A", TTL: 300, data: "93.184.216.34" }],
    });
  });

  it("returns an empty answer list for NOERROR with no records — not an error", async () => {
    mockFetch({ Status: 0 });
    const r = await resolveDns("example.com", "MX");
    expect(r).toEqual({ ok: true, answers: [] });
  });

  it("gives a clear NXDOMAIN error, distinct from an empty answer list", async () => {
    mockFetch({ Status: 3 });
    const r = await resolveDns("does-not-exist-at-all.example", "A");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/does not exist \(NXDOMAIN\)/i);
  });

  it("errors when the resolver itself answers with a non-2xx status", async () => {
    mockFetch({}, false, 503);
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(false);
  });

  it("errors when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(false);
  });

  it("strips a trailing dot and lowercases before validating", async () => {
    mockFetch({ Status: 0, Answer: [] });
    const r = await resolveDns("EXAMPLE.com.", "A");
    expect(r.ok).toBe(true);
  });
});
