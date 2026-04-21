import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";
import { afterEach, describe, expect, it, vi } from "vitest";

function textRes(body: string, status = 200): Response {
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    text: async () => body,
  } as unknown as Response;
}

describe("webSurfaceCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await webSurfaceCheck("nope")).status).toBe("error");
  });

  it("aggregates robots/sitemap/head signals", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt")) return textRes("User-agent: *\nDisallow: /admin");
      if (url.endsWith("/sitemap.xml"))
        return textRes("<urlset><url><loc>/a</loc></url><url><loc>/b</loc></url></urlset>");
      return textRes(
        `<html><head>
          <title>Example</title>
          <meta name="description" content="An example site.">
          <meta property="og:title" content="Example OG">
          <meta property="og:image" content="https://example.com/og.png">
          <meta name="twitter:card" content="summary_large_image">
        </head><body></body></html>`,
      );
    }) as unknown as typeof fetch;

    const r = await webSurfaceCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.robots.present).toBe(true);
      expect(r.data.sitemap.present).toBe(true);
      expect(r.data.sitemap.urlCount).toBe(2);
      expect(r.data.head.title).toBe("Example");
      expect(r.data.head.description).toBe("An example site.");
      expect(r.data.head.og["og:title"]).toBe("Example OG");
      expect(r.data.head.og["og:image"]).toBe("https://example.com/og.png");
      expect(r.data.head.twitter["twitter:card"]).toBe("summary_large_image");
    }
  });

  it("tolerates missing robots and sitemap", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt")) return textRes("", 404);
      if (url.endsWith("/sitemap.xml")) return textRes("", 404);
      return textRes("<html><head></head></html>");
    }) as unknown as typeof fetch;

    const r = await webSurfaceCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.robots.present).toBe(false);
      expect(r.data.sitemap.present).toBe(false);
    }
  });

  it("tolerates robots throwing while home succeeds", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt")) throw new Error("ECONNRESET");
      if (url.endsWith("/sitemap.xml")) return textRes("", 404);
      return textRes("<html><head><title>Hi</title></head></html>");
    }) as unknown as typeof fetch;

    const r = await webSurfaceCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.robots.present).toBe(false);
      expect(r.data.head.title).toBe("Hi");
    }
  });

  it("returns error if the home page itself fails", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt") || url.endsWith("/sitemap.xml")) return textRes("", 404);
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const r = await webSurfaceCheck("example.com");
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
    const r = await webSurfaceCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  }, 500);
});
