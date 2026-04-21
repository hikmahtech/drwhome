import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type ConsumeResult =
  | { allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; resetAt: Date };

type Buckets = { dossier: Ratelimit; standalone: Ratelimit };

let cached: Buckets | null | undefined;

function getBuckets(): Buckets | null {
  if (cached !== undefined) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cached = null;
    return null;
  }
  const redis = new Redis({ url, token });
  cached = {
    dossier: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      prefix: "rl",
      analytics: false,
    }),
    standalone: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 h"),
      prefix: "rl",
      analytics: false,
    }),
  };
  return cached;
}

async function consume(bucket: "dossier" | "standalone", ip: string): Promise<ConsumeResult> {
  const buckets = getBuckets();
  if (!buckets) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, resetAt: new Date(0) };
  }
  const limiter = buckets[bucket];
  const r = await limiter.limit(`${bucket}:${ip}`);
  if (r.success) return { allowed: true, remaining: r.remaining, resetAt: new Date(r.reset) };
  return { allowed: false, resetAt: new Date(r.reset) };
}

export function consumeDossier(ip: string): Promise<ConsumeResult> {
  return consume("dossier", ip);
}

export function consumeStandaloneDossier(ip: string): Promise<ConsumeResult> {
  return consume("standalone", ip);
}
