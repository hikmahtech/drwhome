/**
 * Fixed-window limiter held in memory. Correct because the app runs as one replica;
 * a second replica would need a shared store.
 */
type Window = { start: number; count: number };

export type Limiter = { take: (key: string | null) => { ok: boolean; retryAfter: number } };

export function createLimiter(opts: {
  perWindow: number;
  windowMs: number;
  /** Callers with no address share one bucket, kept small so they cannot crowd out the rest. */
  anonymousPerWindow: number;
  now?: () => number;
}): Limiter {
  const windows = new Map<string, Window>();
  const now = opts.now ?? Date.now;

  return {
    take(key) {
      const t = now();
      const id = key ?? "\0anonymous";
      const limit = key ? opts.perWindow : opts.anonymousPerWindow;

      let w = windows.get(id);
      if (!w || t - w.start >= opts.windowMs) {
        w = { start: t, count: 0 };
        windows.set(id, w);
      }
      // Sweep expired windows now and then, so the map cannot grow without bound.
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (t - v.start >= opts.windowMs) windows.delete(k);
      }

      if (w.count >= limit) {
        return { ok: false, retryAfter: Math.ceil((w.start + opts.windowMs - t) / 1000) };
      }
      w.count += 1;
      return { ok: true, retryAfter: 0 };
    },
  };
}
