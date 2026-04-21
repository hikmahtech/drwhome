import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown, _keyParts: string[], _opts: unknown) => fn,
  revalidateTag: vi.fn(),
}));

describe("cache helpers", () => {
  it("tagFor produces deterministic tags", async () => {
    const { tagFor } = await import("@/lib/dossier/cache");
    expect(tagFor("dns", "example.com")).toBe("dossier:dns:example.com");
    expect(tagFor("web-surface", "stripe.com")).toBe("dossier:web-surface:stripe.com");
  });

  it("withCache passes the domain through to the wrapped check", async () => {
    const { withCache } = await import("@/lib/dossier/cache");
    const inner = vi.fn(async (d: string) => ({ status: "ok", data: d, fetchedAt: "t" }) as const);
    const wrapped = withCache(inner, { id: "dns", ttlSeconds: 3600 });
    const r = await wrapped("example.com");
    expect(inner).toHaveBeenCalledWith("example.com");
    expect(r.status).toBe("ok");
  });

  it("revalidateAllTags invokes revalidateTag for every registered check", async () => {
    const cache = await import("@/lib/dossier/cache");
    const next = await import("next/cache");
    await cache.revalidateAllTags("example.com");
    const calls = (next.revalidateTag as unknown as { mock: { calls: string[][] } }).mock.calls.map(
      (c) => c[0],
    );
    // 10 checks => 10 revalidations
    expect(calls.filter((t) => t.startsWith("dossier:")).length).toBeGreaterThanOrEqual(10);
    expect(calls).toContain("dossier:dns:example.com");
    expect(calls).toContain("dossier:web-surface:example.com");
  });
});
