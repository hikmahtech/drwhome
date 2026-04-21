import { DEFAULT_DKIM_SELECTORS, dkimCheck } from "@/lib/dossier/checks/dkim";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("dkimCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("probes all default selectors in parallel", async () => {
    const calls: string[] = [];
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const name = new URL(url).searchParams.get("name") ?? "";
      calls.push(name);
      const isGoogle = name.startsWith("google._domainkey.");
      return {
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: isGoogle ? [{ name, type: 16, TTL: 60, data: '"v=DKIM1; k=rsa; p=ABCDEF"' }] : [],
        }),
      };
    }) as unknown as typeof fetch;

    const r = await dkimCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.selectors).toHaveLength(DEFAULT_DKIM_SELECTORS.length);
      const google = r.data.selectors.find((s) => s.selector === "google");
      expect(google?.status).toBe("found");
      if (google && google.status === "found") expect(google.record).toContain("v=DKIM1");
      for (const s of r.data.selectors) {
        if (s.selector !== "google") expect(s.status).toBe("not_found");
      }
    }
    expect(calls).toHaveLength(DEFAULT_DKIM_SELECTORS.length);
    for (const sel of DEFAULT_DKIM_SELECTORS) {
      expect(calls).toContain(`${sel}._domainkey.example.com`);
    }
  });

  it("returns not_applicable when no selector has a record", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;
    expect((await dkimCheck("example.com")).status).toBe("not_applicable");
  });

  it("honours a caller-supplied selector list", async () => {
    const calls: string[] = [];
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const name = new URL(url).searchParams.get("name") ?? "";
      calls.push(name);
      return {
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ name, type: 16, TTL: 60, data: '"v=DKIM1; p=Z"' }],
        }),
      };
    }) as unknown as typeof fetch;

    const r = await dkimCheck("example.com", { selectors: ["x"] });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.selectors).toEqual([
        expect.objectContaining({ selector: "x", status: "found" }),
      ]);
    }
    expect(calls).toEqual(["x._domainkey.example.com"]);
  });

  it("returns timeout on hanging fetch", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    const r = await dkimCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 200);

  it("rejects invalid domain", async () => {
    expect((await dkimCheck("nope")).status).toBe("error");
  });
});
