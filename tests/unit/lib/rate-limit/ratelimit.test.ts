import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rate-limit helper", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("short-circuits to allowed when env vars are absent (dev mode)", async () => {
    // biome-ignore lint/performance/noDelete: must fully remove env var (undefined assignment leaves "undefined" string)
    delete process.env.UPSTASH_REDIS_REST_URL;
    // biome-ignore lint/performance/noDelete: must fully remove env var (undefined assignment leaves "undefined" string)
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { consumeDossier, consumeStandaloneDossier } = await import("@/lib/rate-limit/ratelimit");
    const a = await consumeDossier("203.0.113.7");
    expect(a.allowed).toBe(true);
    const b = await consumeStandaloneDossier("203.0.113.7");
    expect(b.allowed).toBe(true);
  });

  it("passes through to the limiter when env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    vi.doMock("@upstash/redis", () => ({
      Redis: class {},
    }));
    const limitMock = vi.fn(async () => ({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    }));
    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: class {
        static slidingWindow(..._args: unknown[]) {
          return {};
        }
        limit = limitMock;
      },
    }));
    const { consumeDossier } = await import("@/lib/rate-limit/ratelimit");
    const r = await consumeDossier("203.0.113.7");
    expect(r.allowed).toBe(true);
    expect(limitMock).toHaveBeenCalledWith("dossier:203.0.113.7");
  });

  it("returns allowed:false with resetAt when limiter rejects", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const resetMs = Date.now() + 1_234;
    vi.doMock("@upstash/redis", () => ({
      Redis: class {},
    }));
    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: class {
        static slidingWindow(..._args: unknown[]) {
          return {};
        }
        limit = async () => ({ success: false, remaining: 0, reset: resetMs });
      },
    }));
    const { consumeStandaloneDossier } = await import("@/lib/rate-limit/ratelimit");
    const r = await consumeStandaloneDossier("203.0.113.7");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.resetAt.getTime()).toBe(resetMs);
  });
});
