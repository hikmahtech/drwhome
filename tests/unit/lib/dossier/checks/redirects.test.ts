import { redirectsCheck } from "@/lib/dossier/checks/redirects";
import { afterEach, describe, expect, it, vi } from "vitest";

function res(status: number, headers: Record<string, string> = {}): Response {
  return {
    ok: status < 400,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as Response;
}

describe("redirectsCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await redirectsCheck("nope")).status).toBe("error");
  });

  it("follows redirects and returns the chain", async () => {
    const urls = [
      "https://example.com/",
      "https://www.example.com/",
      "https://www.example.com/final",
    ];
    let i = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      const current = i++;
      if (current === 0) return res(301, { location: urls[1] });
      if (current === 1) return res(302, { location: urls[2] });
      return res(200);
    }) as unknown as typeof fetch;

    const r = await redirectsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.hops.map((h) => h.url)).toEqual(urls);
      expect(r.data.hops.map((h) => h.status)).toEqual([301, 302, 200]);
      expect(r.data.finalStatus).toBe(200);
    }
  });

  it("returns ok with a single hop when initial response is 2xx", async () => {
    global.fetch = vi.fn().mockResolvedValue(res(200)) as unknown as typeof fetch;
    const r = await redirectsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.hops).toHaveLength(1);
  });

  it("returns error when redirect cap exceeded", async () => {
    global.fetch = vi
      .fn()
      .mockImplementation(async () =>
        res(301, { location: "https://example.com/loop" }),
      ) as unknown as typeof fetch;
    const r = await redirectsCheck("example.com", { maxHops: 3 });
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toMatch(/cap/i);
  });

  it("returns error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ENOTFOUND")) as unknown as typeof fetch;
    const r = await redirectsCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    expect((await redirectsCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  }, 200);
});
