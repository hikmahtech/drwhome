import { afterEach, describe, expect, it, vi } from "vitest";
import { DNSBLS, checkBlacklists, classifyAnswers, reverseIpv4 } from "../../src/lib/blacklist";

const json = (obj: unknown) => ({ ok: true, json: async () => obj }) as unknown as Response;

describe("reverseIpv4", () => {
  it("reverses the octets", () => {
    expect(reverseIpv4("1.2.3.4")).toBe("4.3.2.1");
    expect(reverseIpv4("93.184.216.34")).toBe("34.216.184.93");
  });
  it("rejects non-IPv4 and out-of-range", () => {
    expect(reverseIpv4("2001:db8::1")).toBeNull();
    expect(reverseIpv4("1.2.3.999")).toBeNull();
    expect(reverseIpv4("not-an-ip")).toBeNull();
  });
});

describe("classifyAnswers", () => {
  const A = (data: string) => ({ name: "x", type: 1, TTL: 60, data });
  it("null (network error) → unavailable", () => {
    expect(classifyAnswers(null).status).toBe("unavailable");
  });
  it("empty (NXDOMAIN) → clean", () => {
    expect(classifyAnswers([]).status).toBe("clean");
  });
  it("a 127.0.0.x code → listed", () => {
    const r = classifyAnswers([A("127.0.0.2")]);
    expect(r.status).toBe("listed");
    expect(r.codes).toContain("127.0.0.2");
  });
  it("Spamhaus-style public-resolver block sentinel → unavailable, not listed", () => {
    expect(classifyAnswers([A("127.255.255.254")]).status).toBe("unavailable");
  });
});

describe("checkBlacklists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an invalid domain", async () => {
    const r = await checkBlacklists("not a domain");
    expect(r.ok).toBe(false);
  });

  it("errors when the domain resolves to no A or MX records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ Status: 3 })),
    );
    const r = await checkBlacklists("example.com");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/no A or MX/i);
  });

  it("flags an IP that is listed on one blocklist and clean on the rest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        const u = new URL(String(url));
        const name = u.searchParams.get("name") ?? "";
        const type = u.searchParams.get("type") ?? "";
        if (type === "A" && name === "example.com") {
          return json({ Status: 0, Answer: [{ name, type: 1, TTL: 300, data: "1.2.3.4" }] });
        }
        if (type === "MX" && name === "example.com") return json({ Status: 0, Answer: [] });
        // reversed 1.2.3.4 = 4.3.2.1 ; list it on Barracuda only
        if (name === "4.3.2.1.b.barracudacentral.org") {
          return json({ Status: 0, Answer: [{ name, type: 1, TTL: 60, data: "127.0.0.2" }] });
        }
        return json({ Status: 3 }); // NXDOMAIN elsewhere = clean
      }),
    );

    const r = await checkBlacklists("example.com");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.domain).toBe("example.com");
    expect(r.checkedLists).toBe(DNSBLS.length);
    expect(r.ips).toHaveLength(1);
    expect(r.ips[0].ip).toBe("1.2.3.4");
    expect(r.ips[0].listedOn).toBe(1);
    expect(r.listedIps).toBe(1);
    const barracuda = r.ips[0].listings.find((l) => l.listId === "barracuda");
    expect(barracuda?.status).toBe("listed");
    const spamcop = r.ips[0].listings.find((l) => l.listId === "spamcop");
    expect(spamcop?.status).toBe("clean");
  });

  it("marks a list unavailable, not listed, when it answers with the public-resolver sentinel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        const u = new URL(String(url));
        const name = u.searchParams.get("name") ?? "";
        const type = u.searchParams.get("type") ?? "";
        if (type === "A" && name === "example.com") {
          return json({ Status: 0, Answer: [{ name, type: 1, TTL: 300, data: "1.2.3.4" }] });
        }
        if (type === "MX" && name === "example.com") return json({ Status: 0, Answer: [] });
        if (name === "4.3.2.1.b.barracudacentral.org") {
          return json({ Status: 0, Answer: [{ name, type: 1, TTL: 60, data: "127.255.255.254" }] });
        }
        return json({ Status: 3 });
      }),
    );

    const r = await checkBlacklists("example.com");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.listedIps).toBe(0);
    const barracuda = r.ips[0].listings.find((l) => l.listId === "barracuda");
    expect(barracuda?.status).toBe("unavailable");
  });
});
