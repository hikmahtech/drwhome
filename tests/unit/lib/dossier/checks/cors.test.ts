import { corsCheck } from "@/lib/dossier/checks/cors";
import { afterEach, describe, expect, it, vi } from "vitest";

function res(headers: Record<string, string>, status = 204): Response {
  return { ok: status < 400, status, headers: new Headers(headers) } as unknown as Response;
}

describe("corsCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await corsCheck("nope")).status).toBe("error");
  });

  it("returns ok with AC-* headers collected", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      res({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST",
        "Access-Control-Max-Age": "600",
        "Content-Type": "text/plain",
      }),
    ) as unknown as typeof fetch;

    const r = await corsCheck("example.com", { origin: "https://drwho.me", method: "GET" });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.allowOrigin).toBe("*");
      expect(r.data.allowMethods).toBe("GET,POST");
      expect(r.data.maxAge).toBe("600");
      expect(r.data.preflightStatus).toBe(204);
      expect(r.data.anyAcHeader).toBe(true);
      expect(r.data.origin).toBe("https://drwho.me");
      expect(r.data.method).toBe("GET");
    }
  });

  it("returns ok with anyAcHeader=false when no AC-* headers present", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(res({ "Content-Type": "text/plain" }, 405)) as unknown as typeof fetch;
    const r = await corsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.anyAcHeader).toBe(false);
      expect(r.data.preflightStatus).toBe(405);
    }
  });

  it("defaults origin to https://drwho.me and method to GET", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    global.fetch = vi.fn((_url: string, opts: { headers?: Record<string, string> }) => {
      capturedHeaders = opts?.headers;
      return Promise.resolve(res({}));
    }) as unknown as typeof fetch;

    const r = await corsCheck("example.com");
    expect(r.status).toBe("ok");
    expect(capturedHeaders?.Origin).toBe("https://drwho.me");
    expect(capturedHeaders?.["Access-Control-Request-Method"]).toBe("GET");
  });

  it("uppercases the method input", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    global.fetch = vi.fn((_url: string, opts: { headers?: Record<string, string> }) => {
      capturedHeaders = opts?.headers;
      return Promise.resolve(res({}));
    }) as unknown as typeof fetch;

    const r = await corsCheck("example.com", { method: "post" });
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.method).toBe("POST");
    expect(capturedHeaders?.["Access-Control-Request-Method"]).toBe("POST");
  });

  it("returns error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    expect((await corsCheck("example.com")).status).toBe("error");
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise<Response>((_, reject) => {
        opts?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    expect((await corsCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  }, 200);
});
