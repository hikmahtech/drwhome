import { headersCheck } from "@/lib/dossier/checks/headers";
import { afterEach, describe, expect, it, vi } from "vitest";

function res(headers: Record<string, string>, url = "https://example.com/"): Response {
  return {
    ok: true,
    status: 200,
    url,
    headers: new Headers(headers),
  } as unknown as Response;
}

describe("headersCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await headersCheck("nope")).status).toBe("error");
  });

  it("returns ok with lowercased header map and final url", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      res({
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "DENY",
      }),
    ) as unknown as typeof fetch;

    const r = await headersCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.finalUrl).toBe("https://example.com/");
      expect(r.data.headers["strict-transport-security"]).toBe("max-age=31536000");
      expect(r.data.headers["content-security-policy"]).toBe("default-src 'self'");
      expect(r.data.headers["x-frame-options"]).toBe("DENY");
    }
  });

  it("returns error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    expect((await headersCheck("example.com")).status).toBe("error");
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    expect((await headersCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  }, 200);
});
