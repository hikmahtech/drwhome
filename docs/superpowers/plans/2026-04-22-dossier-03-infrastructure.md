# Domain Dossier — Plan 3: Infrastructure (rate limit, denylist, caching, `dossier_full`, Lighthouse)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## Progress (paused 2026-04-22)

**Worktree:** `/Users/arshad/Workspace/hikmah/drwho/.claude/worktrees/dossier-plan-3` (branch `dossier-plan-3`).

**Completed (6 / 13 tasks, commits on branch):**

- [x] **Task 1** — static denylist (`f40925c`)
- [x] **Task 2** — client-IP extractor (`54f1a17`)
- [x] **Task 3** — Upstash rate-limit helper w/ no-op fallback (`68ad49e`)
- [x] **Task 4** — denylist + rate-limit banner components (`b4a8ae4`)
- [x] **Task 5** — per-check cache wrapper + `lib/dossier/ids.ts` leaf + registry `run`/`runUncached`/`ttlSeconds` (`f8a12d1`)
- [x] **Task 6** — `?refresh=1` bypass via Route Handler + redirect (`b9ac6a7` + fix `3347b61`). **Key learning:** Next 15 forbids `revalidateTag` during render even via server action — had to move invalidation into `app/api/dossier/revalidate/route.ts` and `redirect()` back. First impl was fire-and-forget and only refreshed the *next* load.

**Remaining (7 tasks):**

- [ ] **Task 7** — gate `/d/[domain]` on denylist + `consumeDossier` (30/h). Banner early-returns before Suspense sections. Must insert AFTER `const d = v.domain;` and BEFORE the `sp.refresh === "1"` redirect block. Spec in plan §Task 7.
- [ ] **Task 8** — gate `/tools/[slug]` when slug matches `^dossier-`: standalone bucket (60/h), denylist on `?domain=`, per-tag `?refresh=1` invalidation for the single check.
- [ ] **Task 9** — `withDenylist` wrapper on MCP dossier handlers (`lib/mcp/tools.ts`) + `tests/unit/lib/mcp/dossier.test.ts`.
- [ ] **Task 10** — `dossier_full` aggregate MCP tool (virtual slug `dossier-full`, not in `content/tools.ts`). Bump tool-count assertion 20→21 in `tests/unit/lib/mcp/tools.test.ts`. Upgrade Task 9's `startsWith("dossier_")` heuristic to explicit `DENYLIST_GATED` Set including `dossier_full`.
- [ ] **Task 11** — sitemap regression test (no `/d/` entries) + README env vars + dossier section.
- [ ] **Task 12** — Lighthouse CI: add `/d/example.com` to `.lighthouserc.json`; add `lighthouse` job to `.github/workflows/ci.yml`.
- [ ] **Task 13** — final gate: lint, typecheck, unit, e2e, `pnpm lh`, build, manual smoke, final commit.

**Resume recipe:**
1. `cd /Users/arshad/Workspace/hikmah/drwho/.claude/worktrees/dossier-plan-3`
2. `git rev-parse --abbrev-ref HEAD` → must print `dossier-plan-3`.
3. Invoke `superpowers:subagent-driven-development`, dispatch Task 7 implementer (haiku — mechanical edit). Task spec is verbatim in plan §Task 7.
4. Streamlined review per task: implementer → spec review. Full three-stage only for Tasks 10 + 13 (judgment).
5. Every subagent prompt MUST verify worktree branch before committing (Plan 1 incident).
6. Commits: single-line conventional, no trailers.

---

**Goal:** Land the cross-cutting infrastructure layer for the domain dossier: Upstash Redis rate limiting, a static denylist, per-check `unstable_cache` TTLs with a `?refresh=1` bypass, the `dossier_full` aggregate MCP tool, and a Lighthouse CI gate on `/d/example.com`. After this plan, Plans 1 + 2 ship as a production-ready flagship.

**Architecture:**

- **Rate limiting** via `@upstash/redis` + `@upstash/ratelimit` (two new npm deps, only external service). Two sliding-window buckets keyed by client IP: `dossier` (30/hour) consumed by `/d/[domain]`, and `dossier-standalone` (60/hour) consumed when the `/tools/[slug]` generic route serves a `dossier-*` slug. If env vars are unset (local dev, CI without secrets), the helper short-circuits to `{allowed: true}` — never fails closed on missing credentials.
- **Denylist** is a committed static set in `lib/dossier/denylist.ts`, consulted at three call sites: `/d/[domain]/page.tsx`, `app/tools/[slug]/page.tsx` (dossier slugs only), and every dossier MCP tool handler. Rejections render a uniform `DenylistBanner` in the web UI and an `isError` MCP result with a clear string.
- **Caching** wraps each pure check via a single factory `withCache(check, {tag, ttlSeconds})` in `lib/dossier/cache.ts`. Tag shape is `dossier:<id>:<domain>`. The `dossierChecks` registry now holds `run` (cached) and `runUncached` (raw). `/d/[domain]` reads `?refresh=1`; when truthy, it calls `revalidateTag` for all 10 tags before rendering.
- **`dossier_full` MCP tool** runs all 10 checks (via the cached registry) in parallel, serialises as `{ dns, mx, spf, ... }` keyed by `DossierCheckId`. One MCP tool call → aggregate payload. Paywall unchanged (`MCP_PAYWALL_ENABLED`).
- **Lighthouse CI** already exists via `pnpm lh` and `.lighthouserc.json`. Extend the URL list to include `/d/example.com`, then add a dedicated GitHub Actions job so the perf ≥ 95 / SEO ≥ 95 gate enforces on PRs.
- **Sitemap exclusion** for `/d/*` is already correct (sitemap maps only `content/tools.ts` slugs). Lock it in with a regression test and update README.

**Tech stack:** existing — Next.js 15 App Router + TypeScript strict + Tailwind v4 + Vitest + Playwright. New deps: `@upstash/redis` + `@upstash/ratelimit` (only additions this plan).

**Reference spec:** `docs/superpowers/specs/2026-04-21-domain-dossier-design.md` §§ "Caching", "Input validation and abuse controls", "MCP integration", "Testing".

**Reference plans:**
- `docs/superpowers/plans/2026-04-21-dossier-01-scaffolding-and-dns.md`
- `docs/superpowers/plans/2026-04-22-dossier-02-remaining-checks.md`

**Out of scope:**

- Rate-limiting any non-dossier `/tools/*` slugs. Only dossier surfaces get buckets this plan.
- Rate-limiting the MCP endpoint — paywall handles MCP abuse control, and denylist is the only MCP addition here.
- Monitoring / persistence / diffing dossiers over time (B-bet, deferred).
- DKIM selector discovery beyond the Plan 2 fixed list.
- Denylist admin UI. Static committed file only.

---

## Invariants reaffirmed

- Pure check logic in `lib/dossier/checks/*.ts`. UI in `components/dossier/*`. Both web and MCP import the same pure fns. (CLAUDE.md)
- `content/tools.ts` is the single tool registry. `dossier_full` does NOT add a slug — it's MCP-only. (Design spec §MCP integration: 11 tools total — 10 per-check + 1 aggregate; only the 10 have web tool pages.)
- Theme tokens in `app/globals.css` only. No hardcoded colors. (CLAUDE.md)
- Max width 680px, monospace everywhere, no shadows, radius ≤ 4px. (CLAUDE.md)
- `params` / `searchParams` are `Promise<...>` in Next 15 — always `await`.
- `typedRoutes: true` validates `<Link href>` at build.
- Biome lints everything. No `any`, no `!`, no unused vars.
- Tests live under `tests/unit/...` mirroring source tree. E2E under `tests/e2e/`.
- Commit messages are single-line conventional commits. No trailers. (cmemory lesson.)
- Never hardcode secrets. Env vars documented in `README.md`. (CLAUDE.md credentials policy.)

---

## Worktree discipline (CRITICAL)

Plan 1 had one incident where a subagent committed to `main` instead of the worktree branch. Every implementer prompt MUST begin with:

```
cd /Users/arshad/Workspace/hikmah/drwho/.claude/worktrees/dossier-plan-3
pwd   # expect .../.claude/worktrees/dossier-plan-3
git rev-parse --abbrev-ref HEAD   # expect worktree-dossier-plan-3
```

If either check fails, STOP and escalate — do NOT proceed with edits. Re-verify branch before EVERY `git commit`.

---

## File Structure

**Created:**

- `lib/dossier/denylist.ts` — `isDenied(domain)`; returns `{denied:true, reason} | {denied:false}`. Exports `DENYLIST: ReadonlySet<string>`.
- `tests/unit/lib/dossier/denylist.test.ts`
- `lib/rate-limit/client-ip.ts` — `extractClientIp(headers: Headers): string` from `x-forwarded-for` / `x-real-ip` / literal `"unknown"`.
- `tests/unit/lib/rate-limit/client-ip.test.ts`
- `lib/rate-limit/ratelimit.ts` — lazy-inits the Upstash client once, exposes `consumeDossier(ip)` and `consumeStandaloneDossier(ip)`, each returning `{allowed:true, remaining, resetAt} | {allowed:false, resetAt}`. No-op `{allowed:true, remaining:Infinity, resetAt:Date}` when env vars absent.
- `tests/unit/lib/rate-limit/ratelimit.test.ts`
- `components/dossier/DenylistBanner.tsx` — inline notice component replacing all 10 sections on a denylisted domain.
- `components/dossier/RateLimitBanner.tsx` — inline notice when client IP is out of budget, with reset-at time.
- `tests/unit/components/dossier/DenylistBanner.test.tsx`
- `tests/unit/components/dossier/RateLimitBanner.test.tsx`
- `lib/dossier/cache.ts` — `withCache<T>(fn, opts)` factory; `tagFor(id, domain)` helper; `revalidateAllTags(domain)` helper.
- `tests/unit/lib/dossier/cache.test.ts`
- `tests/unit/lib/mcp/dossier-full.test.ts` — handler-level tests for `dossier_full`.
- `tests/unit/app/sitemap.test.ts` — asserts sitemap contains no `/d/` entries (regression guard).

**Modified:**

- `package.json` — add `@upstash/redis` and `@upstash/ratelimit` deps.
- `lib/dossier/registry.ts` — each check now has `run` (cached) + `runUncached` (raw). Add TTL + tag metadata per entry.
- `app/d/[domain]/page.tsx` — extract IP → rate-limit → denylist checks → handle `?refresh=1` → render sections.
- `app/tools/[slug]/page.tsx` — if slug matches `/^dossier-/`, do rate-limit (standalone bucket) + denylist(`?domain=`).
- `lib/mcp/tools.ts` — add `dossier_full` tool. Wrap every dossier handler with a denylist pre-check.
- `tests/unit/lib/mcp/tools.test.ts` — bump expected tool count 20 → 21; add `dossier_full` to the name list.
- `tests/unit/lib/mcp/dossier.test.ts` — assert each handler rejects a denylisted domain.
- `tests/e2e/dossier.spec.ts` — add a `?refresh=1` smoke and a denylist smoke.
- `.lighthouserc.json` — add `http://localhost:3000/d/example.com` to `collect.url`.
- `.github/workflows/ci.yml` — new `lighthouse` job gating PRs.
- `README.md` — add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to the env-vars table; document `?refresh=1` and denylist behaviour.

---

## Cache TTLs (from design spec)

| Check id        | ttlSeconds | Tag                                       |
| --------------- | ---------- | ----------------------------------------- |
| `dns`           | 3600       | `dossier:dns:<domain>`                    |
| `mx`            | 3600       | `dossier:mx:<domain>`                     |
| `spf`           | 3600       | `dossier:spf:<domain>`                    |
| `dmarc`         | 3600       | `dossier:dmarc:<domain>`                  |
| `dkim`          | 900        | `dossier:dkim:<domain>` (short: selector list is input-dependent) |
| `tls`           | 21600      | `dossier:tls:<domain>`                    |
| `redirects`     | 900        | `dossier:redirects:<domain>`              |
| `headers`       | 900        | `dossier:headers:<domain>`                |
| `cors`          | 900        | `dossier:cors:<domain>`                   |
| `web-surface`   | 900        | `dossier:web-surface:<domain>`            |

Spec table says DKIM = 1 hour in the "Caching" section but the DKIM variants (selector list) mean we keep it at 15 min (aligned with the other "probe"-style checks) to avoid stale negative results. If an implementer sees the discrepancy, use 900s and reference this note.

---

## Task 1: Static denylist

**Files:**
- Create: `lib/dossier/denylist.ts`
- Create: `tests/unit/lib/dossier/denylist.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/lib/dossier/denylist.test.ts
import { describe, expect, it } from "vitest";
import { DENYLIST, isDenied } from "@/lib/dossier/denylist";

describe("isDenied", () => {
  it("returns denied for an exact match", () => {
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    const r = isDenied(entry);
    expect(r.denied).toBe(true);
    if (r.denied) expect(r.reason).toMatch(/abuse|denylist/i);
  });

  it("matches case-insensitively and ignores a trailing dot", () => {
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    expect(isDenied(entry.toUpperCase()).denied).toBe(true);
    expect(isDenied(`${entry}.`).denied).toBe(true);
  });

  it("returns allowed for a non-denylisted domain", () => {
    expect(isDenied("example.com").denied).toBe(false);
  });

  it("does not match parent / sibling domains of a listed entry", () => {
    // a.bad.example listed must NOT deny bad.example or c.bad.example
    // (denylist is exact-match only, by design)
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST must seed at least one domain");
    const parent = entry.split(".").slice(-2).join(".");
    if (parent !== entry) {
      expect(isDenied(parent).denied).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/dossier/denylist.test.ts`
Expected: FAIL with "Cannot find module '@/lib/dossier/denylist'".

- [ ] **Step 3: Implement**

```ts
// lib/dossier/denylist.ts
/**
 * Static list of abuse-prone dossier targets. Populated reactively.
 * Edits here ship on the next deploy — no DB, no admin UI.
 * Match is EXACT (case-insensitive, trailing-dot-tolerant). No subdomain wildcarding.
 */
export const DENYLIST: ReadonlySet<string> = new Set([
  // Seed with a single obviously-hostile sample so the type & tests have something to bind to.
  // Add real entries as incidents happen.
  "phishy-example-abuse.test",
]);

const DENIAL_REASON = "this domain is on the drwho.me denylist for abuse reasons";

export type DenyResult = { denied: true; reason: string } | { denied: false };

export function isDenied(domain: string): DenyResult {
  const normalised = domain.trim().toLowerCase().replace(/\.$/, "");
  return DENYLIST.has(normalised) ? { denied: true, reason: DENIAL_REASON } : { denied: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/lib/dossier/denylist.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git rev-parse --abbrev-ref HEAD   # confirm worktree-dossier-plan-3
git add lib/dossier/denylist.ts tests/unit/lib/dossier/denylist.test.ts
git commit -m "feat(dossier): static denylist module"
```

---

## Task 2: Client-IP extractor

**Files:**
- Create: `lib/rate-limit/client-ip.ts`
- Create: `tests/unit/lib/rate-limit/client-ip.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/lib/rate-limit/client-ip.test.ts
import { describe, expect, it } from "vitest";
import { extractClientIp } from "@/lib/rate-limit/client-ip";

function h(pairs: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [k, v] of Object.entries(pairs)) headers.set(k, v);
  return headers;
}

describe("extractClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "   203.0.113.7   , 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    expect(extractClientIp(h({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("returns the literal 'unknown' when neither header is present", () => {
    expect(extractClientIp(h({}))).toBe("unknown");
  });

  it("returns 'unknown' when x-forwarded-for is empty or whitespace", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "" }))).toBe("unknown");
    expect(extractClientIp(h({ "x-forwarded-for": "   " }))).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/rate-limit/client-ip.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement**

```ts
// lib/rate-limit/client-ip.ts
export function extractClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "unknown";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/lib/rate-limit/client-ip.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add lib/rate-limit/client-ip.ts tests/unit/lib/rate-limit/client-ip.test.ts
git commit -m "feat(rate-limit): client-ip extractor"
```

---

## Task 3: Upstash rate-limit helper

**Files:**
- Modify: `package.json`
- Create: `lib/rate-limit/ratelimit.ts`
- Create: `tests/unit/lib/rate-limit/ratelimit.test.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm add @upstash/redis @upstash/ratelimit
```

Expected: `package.json` gets two new entries under `dependencies`; `pnpm-lock.yaml` updates.

- [ ] **Step 2: Write failing test**

```ts
// tests/unit/lib/rate-limit/ratelimit.test.ts
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
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { consumeDossier, consumeStandaloneDossier } = await import(
      "@/lib/rate-limit/ratelimit"
    );
    const a = await consumeDossier("203.0.113.7");
    expect(a.allowed).toBe(true);
    const b = await consumeStandaloneDossier("203.0.113.7");
    expect(b.allowed).toBe(true);
  });

  it("passes through to the limiter when env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    vi.doMock("@upstash/redis", () => ({
      Redis: class {
        // biome-ignore lint/suspicious/noExplicitAny: SDK signature is untyped in this mock
        constructor(_: any) {}
      },
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
      Redis: class {
        // biome-ignore lint/suspicious/noExplicitAny: SDK signature is untyped in this mock
        constructor(_: any) {}
      },
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/rate-limit/ratelimit.test.ts`
Expected: FAIL with "Cannot find module '@/lib/rate-limit/ratelimit'".

- [ ] **Step 4: Implement**

```ts
// lib/rate-limit/ratelimit.ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/unit/lib/rate-limit/ratelimit.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add package.json pnpm-lock.yaml lib/rate-limit/ratelimit.ts tests/unit/lib/rate-limit/ratelimit.test.ts
git commit -m "feat(rate-limit): upstash dossier + standalone buckets"
```

---

## Task 4: Banner components (denylist + rate-limit)

**Files:**
- Create: `components/dossier/DenylistBanner.tsx`
- Create: `components/dossier/RateLimitBanner.tsx`
- Create: `tests/unit/components/dossier/DenylistBanner.test.tsx`
- Create: `tests/unit/components/dossier/RateLimitBanner.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// tests/unit/components/dossier/DenylistBanner.test.tsx
import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("DenylistBanner", () => {
  it("renders the domain and the reason text", () => {
    render(<DenylistBanner domain="bad.example" reason="abuse report" />);
    expect(screen.getByText(/bad\.example/)).toBeInTheDocument();
    expect(screen.getByText(/abuse report/i)).toBeInTheDocument();
  });
});
```

```tsx
// tests/unit/components/dossier/RateLimitBanner.test.tsx
import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RateLimitBanner", () => {
  it("renders the domain and the reset-at timestamp", () => {
    const resetAt = new Date("2026-04-22T12:00:00Z");
    render(<RateLimitBanner domain="example.com" resetAt={resetAt} />);
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-22T12:00:00/)).toBeInTheDocument();
    expect(screen.getByText(/rate limit/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/components/dossier/DenylistBanner.test.tsx tests/unit/components/dossier/RateLimitBanner.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement DenylistBanner**

```tsx
// components/dossier/DenylistBanner.tsx
export function DenylistBanner({ domain, reason }: { domain: string; reason: string }) {
  return (
    <div className="border rounded-sm p-3 text-sm">
      <p>
        <span className="text-accent">denylist</span> — <code>{domain}</code>
      </p>
      <p className="text-muted mt-1">{reason}</p>
    </div>
  );
}
```

- [ ] **Step 4: Implement RateLimitBanner**

```tsx
// components/dossier/RateLimitBanner.tsx
export function RateLimitBanner({ domain, resetAt }: { domain: string; resetAt: Date }) {
  return (
    <div className="border rounded-sm p-3 text-sm">
      <p>
        <span className="text-accent">rate limit</span> — <code>{domain}</code>
      </p>
      <p className="text-muted mt-1">
        you have exceeded the per-hour dossier budget. budget resets at{" "}
        <time dateTime={resetAt.toISOString()}>{resetAt.toISOString()}</time>.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm test tests/unit/components/dossier/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add components/dossier/DenylistBanner.tsx components/dossier/RateLimitBanner.tsx tests/unit/components/dossier/DenylistBanner.test.tsx tests/unit/components/dossier/RateLimitBanner.test.tsx
git commit -m "feat(dossier): denylist + rate-limit banner components"
```

---

## Task 5: Per-check cache wrapper + tags

**Files:**
- Create: `lib/dossier/cache.ts`
- Create: `tests/unit/lib/dossier/cache.test.ts`
- Modify: `lib/dossier/registry.ts`

- [ ] **Step 1: Write failing test for cache module**

```ts
// tests/unit/lib/dossier/cache.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/dossier/cache.test.ts`
Expected: FAIL with "Cannot find module '@/lib/dossier/cache'".

- [ ] **Step 3: Extract the check-id constant to break the cycle**

`cache.ts` needs `dossierCheckIds` and `registry.ts` needs `withCache`. Break the cycle upfront by splitting ids into their own module.

Create `lib/dossier/ids.ts`:

```ts
// lib/dossier/ids.ts
export type DossierCheckId =
  | "dns"
  | "mx"
  | "spf"
  | "dmarc"
  | "dkim"
  | "tls"
  | "redirects"
  | "headers"
  | "cors"
  | "web-surface";

export const dossierCheckIds: readonly DossierCheckId[] = [
  "dns",
  "mx",
  "spf",
  "dmarc",
  "dkim",
  "tls",
  "redirects",
  "headers",
  "cors",
  "web-surface",
];
```

- [ ] **Step 4: Implement `lib/dossier/cache.ts`**

```ts
// lib/dossier/cache.ts
import { dossierCheckIds, type DossierCheckId } from "@/lib/dossier/ids";
import type { CheckResult } from "@/lib/dossier/types";
import { revalidateTag, unstable_cache } from "next/cache";

export function tagFor(id: DossierCheckId, domain: string): string {
  return `dossier:${id}:${domain}`;
}

type CheckFn<T> = (domain: string) => Promise<CheckResult<T>>;

export function withCache<T>(
  fn: CheckFn<T>,
  opts: { id: DossierCheckId; ttlSeconds: number },
): CheckFn<T> {
  return async (domain: string) => {
    const cached = unstable_cache(
      async (d: string) => fn(d),
      ["dossier", opts.id, domain],
      { revalidate: opts.ttlSeconds, tags: [tagFor(opts.id, domain)] },
    );
    return cached(domain);
  };
}

export async function revalidateAllTags(domain: string): Promise<void> {
  for (const id of dossierCheckIds) {
    revalidateTag(tagFor(id, domain));
  }
}
```

- [ ] **Step 4: Update registry to expose `dossierCheckIds`, `runUncached`, and TTL metadata**

```ts
// lib/dossier/registry.ts
import { corsCheck } from "@/lib/dossier/checks/cors";
import { dkimCheck } from "@/lib/dossier/checks/dkim";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { headersCheck } from "@/lib/dossier/checks/headers";
import { mxCheck } from "@/lib/dossier/checks/mx";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";
import { spfCheck } from "@/lib/dossier/checks/spf";
import { tlsCheck } from "@/lib/dossier/checks/tls";
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";
import { withCache } from "@/lib/dossier/cache";
import type { CheckResult } from "@/lib/dossier/types";

export type DossierCheckId =
  | "dns"
  | "mx"
  | "spf"
  | "dmarc"
  | "dkim"
  | "tls"
  | "redirects"
  | "headers"
  | "cors"
  | "web-surface";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string;
  ttlSeconds: number;
  run: (domain: string) => Promise<CheckResult<unknown>>;        // cached
  runUncached: (domain: string) => Promise<CheckResult<unknown>>; // raw
};

type Raw = {
  id: DossierCheckId;
  title: string;
  toolSlug: string;
  ttlSeconds: number;
  fn: (domain: string) => Promise<CheckResult<unknown>>;
};

const raw: Raw[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", ttlSeconds: 3600, fn: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "dossier-mx", ttlSeconds: 3600, fn: mxCheck },
  { id: "spf", title: "spf", toolSlug: "dossier-spf", ttlSeconds: 3600, fn: spfCheck },
  { id: "dmarc", title: "dmarc", toolSlug: "dossier-dmarc", ttlSeconds: 3600, fn: dmarcCheck },
  {
    id: "dkim",
    title: "dkim",
    toolSlug: "dossier-dkim",
    ttlSeconds: 900,
    // Registry calls run(domain) with no selector list — defaults to common selectors.
    fn: (d: string) => dkimCheck(d),
  },
  { id: "tls", title: "tls", toolSlug: "dossier-tls", ttlSeconds: 21600, fn: tlsCheck },
  {
    id: "redirects",
    title: "redirects",
    toolSlug: "dossier-redirects",
    ttlSeconds: 900,
    fn: redirectsCheck,
  },
  {
    id: "headers",
    title: "headers",
    toolSlug: "dossier-headers",
    ttlSeconds: 900,
    fn: headersCheck,
  },
  {
    id: "cors",
    title: "cors",
    toolSlug: "dossier-cors",
    ttlSeconds: 900,
    // corsCheck(domain, {origin?, method?}) — registry always uses defaults.
    fn: (d: string) => corsCheck(d),
  },
  {
    id: "web-surface",
    title: "web-surface",
    toolSlug: "dossier-web-surface",
    ttlSeconds: 900,
    fn: webSurfaceCheck,
  },
];

export const dossierChecks: DossierCheck[] = raw.map((r) => ({
  id: r.id,
  title: r.title,
  toolSlug: r.toolSlug,
  ttlSeconds: r.ttlSeconds,
  run: withCache(r.fn, { id: r.id, ttlSeconds: r.ttlSeconds }),
  runUncached: r.fn,
}));

export const dossierCheckIds: readonly DossierCheckId[] = raw.map((r) => r.id);

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
```

NOTE: `lib/dossier/cache.ts` imports `dossierCheckIds` from the registry, and the registry imports `withCache` from `cache.ts`. Because `dossierCheckIds` is only read inside the *body* of `revalidateAllTags`, and `withCache` is only read during registry-module top-level evaluation, the cycle is benign (ESM lazy-binding handles it). If Biome or tsc complains, split to `lib/dossier/ids.ts` holding just the `DossierCheckId` union + `dossierCheckIds` constant, and import from there in both files.

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm test tests/unit/lib/dossier/cache.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full suite to catch registry regressions**

Run: `pnpm test`
Expected: all tests pass (existing section tests should continue to use the registry's `run` — now cached but behaviour-identical under the vitest mock).

- [ ] **Step 7: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add lib/dossier/cache.ts lib/dossier/registry.ts tests/unit/lib/dossier/cache.test.ts
git commit -m "feat(dossier): per-check unstable_cache wrapper with tag-based invalidation"
```

---

## Task 6: `?refresh=1` bypass on `/d/[domain]`

**Files:**
- Modify: `app/d/[domain]/page.tsx`
- Modify: `tests/e2e/dossier.spec.ts`

- [ ] **Step 1: Update the page to read `searchParams` and revalidate on `?refresh=1`**

Add `searchParams` to the component signature and invoke `revalidateAllTags` *before* the first `<Suspense>` flushes:

```tsx
// app/d/[domain]/page.tsx (DIFF — only the component signature + top of body)
import { revalidateAllTags } from "@/lib/dossier/cache";

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();
  const d = v.domain;

  const sp = await searchParams;
  if (sp.refresh === "1") {
    await revalidateAllTags(d);
  }

  return (
    <article className="space-y-4">
      {/* ...rest unchanged... */}
    </article>
  );
}
```

Leave all Suspense sections untouched.

- [ ] **Step 2: Add E2E smoke for `?refresh=1`**

```ts
// tests/e2e/dossier.spec.ts — append a new test inside test.describe
test("?refresh=1 still renders all 10 sections", async ({ page }) => {
  await page.goto("/d/example.com?refresh=1");
  for (const id of ["dns", "mx", "spf", "dmarc", "dkim", "tls", "redirects", "headers", "cors", "web-surface"]) {
    await expect(page.locator(`#${id}`).last()).toContainText(
      /\b(ok|error|timeout|not_applicable)\b/,
      { timeout: 20_000 },
    );
  }
});
```

- [ ] **Step 3: Run E2E locally**

Run: `pnpm test:e2e tests/e2e/dossier.spec.ts`
Expected: all four dossier E2Es pass (including new `?refresh=1`).

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add app/d/[domain]/page.tsx tests/e2e/dossier.spec.ts
git commit -m "feat(dossier): ?refresh=1 bypasses unstable_cache via tag invalidation"
```

---

## Task 7: Rate-limit + denylist on `/d/[domain]`

**Files:**
- Modify: `app/d/[domain]/page.tsx`

- [ ] **Step 1: Extend the page to gate rendering on denylist + rate-limit**

Insert the checks *after* domain validation and *before* the `?refresh=1` handler:

```tsx
// app/d/[domain]/page.tsx (add imports + gate block)
import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { isDenied } from "@/lib/dossier/denylist";
import { extractClientIp } from "@/lib/rate-limit/client-ip";
import { consumeDossier } from "@/lib/rate-limit/ratelimit";
import { headers } from "next/headers";

// ...inside DossierPage, right after `const d = v.domain;`:

const denied = isDenied(d);
if (denied.denied) {
  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <DenylistBanner domain={d} reason={denied.reason} />
    </article>
  );
}

const ip = extractClientIp(await headers());
const rl = await consumeDossier(ip);
if (!rl.allowed) {
  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <RateLimitBanner domain={d} resetAt={rl.resetAt} />
    </article>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Run existing E2E to confirm non-denylisted flow still renders**

Run: `pnpm test:e2e tests/e2e/dossier.spec.ts`
Expected: all prior tests pass (denylist + rate-limit are no-ops for example.com + absent UPSTASH env in CI).

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add app/d/[domain]/page.tsx
git commit -m "feat(dossier): gate /d/[domain] on denylist + per-ip rate limit"
```

---

## Task 8: Rate-limit + denylist + `?refresh=1` on `/tools/[slug]` for dossier slugs

**Files:**
- Modify: `app/tools/[slug]/page.tsx`

Rationale: the generic `/tools/[slug]` route already renders dossier slugs (`DossierDns`, `DossierMx`, ...) — each sub-component reads `?domain=` and runs its own section. This task adds a narrow gate: *only* when the slug matches `^dossier-`, apply the `standalone` rate-limit bucket, the denylist, and `?refresh=1` (invalidates only that one check's tag).

- [ ] **Step 1: Extend the generic tool page with dossier-specific gating**

```tsx
// app/tools/[slug]/page.tsx (additions — keep existing logic intact)
import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { tagFor } from "@/lib/dossier/cache";
import { isDenied } from "@/lib/dossier/denylist";
import { findCheck, type DossierCheckId } from "@/lib/dossier/registry";
import { extractClientIp } from "@/lib/rate-limit/client-ip";
import { consumeStandaloneDossier } from "@/lib/rate-limit/ratelimit";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

// ...inside ToolPage, replacing the hard-coded `const domain = ...` with gated logic when slug starts with "dossier-":

const isDossierSlug = slug.startsWith("dossier-");
if (isDossierSlug && typeof domain === "string" && domain.length > 0) {
  const denied = isDenied(domain);
  if (denied.denied) {
    return (
      <article className="space-y-4">
        <Breadcrumb path={`~/tools/${slug}`} />
        <TerminalPrompt>{tool.name}</TerminalPrompt>
        <DenylistBanner domain={domain} reason={denied.reason} />
      </article>
    );
  }
  const ip = extractClientIp(await headers());
  const rl = await consumeStandaloneDossier(ip);
  if (!rl.allowed) {
    return (
      <article className="space-y-4">
        <Breadcrumb path={`~/tools/${slug}`} />
        <TerminalPrompt>{tool.name}</TerminalPrompt>
        <RateLimitBanner domain={domain} resetAt={rl.resetAt} />
      </article>
    );
  }
  if (sp.refresh === "1") {
    // dossier-<id> — map to the registry id
    const id = slug.slice("dossier-".length) as DossierCheckId;
    const check = findCheck(id);
    if (check) revalidateTag(tagFor(id, domain));
  }
}
```

Place this block AFTER `const tool = findTool(slug)` and BEFORE the `const Component = tool.component;` line so denylist/rate-limit short-circuit the render without dropping the existing tool-page shell (breadcrumb + prompt only — full SEO shell returns on allow).

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: E2E — rerun dossier suite**

Run: `pnpm test:e2e tests/e2e/dossier.spec.ts`
Expected: standalone tests still pass (`/tools/dossier-dns?domain=example.com`, `/tools/dossier-mx?domain=gmail.com`).

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add app/tools/[slug]/page.tsx
git commit -m "feat(dossier): gate /tools/dossier-* on denylist + standalone rate-limit + ?refresh=1"
```

---

## Task 9: Denylist on MCP dossier handlers

**Files:**
- Modify: `lib/mcp/tools.ts`
- Modify: `tests/unit/lib/mcp/dossier.test.ts`

Rationale: MCP already has `withPaywall` as its abuse shield. This plan adds a second thin shield — the denylist — so a denylisted domain returns a clear MCP error even if paywall is disabled.

- [ ] **Step 1: Introduce `withDenylist` wrapper in `lib/mcp/tools.ts`**

Add this helper near `withTracking`:

```ts
// lib/mcp/tools.ts (additions)
import { isDenied } from "@/lib/dossier/denylist";

function withDenylist(tool: McpTool): McpTool {
  return {
    ...tool,
    handler: async (input) => {
      const domain = (input as { domain?: unknown }).domain;
      if (typeof domain === "string") {
        const r = isDenied(domain);
        if (r.denied) return fail(r.reason);
      }
      return tool.handler(input);
    },
  };
}
```

Apply it only to the dossier family when assembling `mcpTools`:

```ts
const DOSSIER_PREFIX = "dossier_";

export const mcpTools: McpTool[] = rawMcpTools.map((t) =>
  withTracking(t.name.startsWith(DOSSIER_PREFIX) ? withDenylist(t) : t),
);
```

- [ ] **Step 2: Add test asserting denylist rejection**

Extend `tests/unit/lib/mcp/dossier.test.ts`:

```ts
import { DENYLIST } from "@/lib/dossier/denylist";
import { findMcpTool } from "@/lib/mcp/tools";
import { describe, expect, it } from "vitest";

describe("dossier MCP denylist integration", () => {
  it("rejects denylisted domains with isError on every dossier_* tool", async () => {
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST seed missing");
    const names = [
      "dossier_dns",
      "dossier_mx",
      "dossier_spf",
      "dossier_dmarc",
      "dossier_dkim",
      "dossier_tls",
      "dossier_redirects",
      "dossier_headers",
      "dossier_cors",
      "dossier_web_surface",
    ] as const;
    for (const n of names) {
      const tool = findMcpTool(n);
      if (!tool) throw new Error(`${n} not found`);
      const r = await tool.handler({ domain: entry });
      expect(r.isError, `${n} should error on denylisted domain`).toBe(true);
    }
  });
});
```

If `tests/unit/lib/mcp/dossier.test.ts` does not already exist, create it with the imports + block above; otherwise append the `describe`.

- [ ] **Step 3: Run tests**

Run: `pnpm test tests/unit/lib/mcp/dossier.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add lib/mcp/tools.ts tests/unit/lib/mcp/dossier.test.ts
git commit -m "feat(mcp): denylist wrapper on all dossier_* handlers"
```

---

## Task 10: `dossier_full` MCP aggregate tool

**Files:**
- Modify: `lib/mcp/tools.ts`
- Modify: `tests/unit/lib/mcp/tools.test.ts`
- Create: `tests/unit/lib/mcp/dossier-full.test.ts`

- [ ] **Step 1: Write failing handler test**

```ts
// tests/unit/lib/mcp/dossier-full.test.ts
import { findMcpTool } from "@/lib/mcp/tools";
import { describe, expect, it } from "vitest";

describe("dossier_full", () => {
  it("is registered in mcpTools", () => {
    expect(findMcpTool("dossier_full")).toBeDefined();
  });

  it("returns a JSON object keyed by every DossierCheckId", async () => {
    const tool = findMcpTool("dossier_full");
    if (!tool) throw new Error("dossier_full not registered");
    const r = await tool.handler({ domain: "example.com" });
    const text = r.content[0]?.type === "text" ? r.content[0].text : "";
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const ids = [
      "dns",
      "mx",
      "spf",
      "dmarc",
      "dkim",
      "tls",
      "redirects",
      "headers",
      "cors",
      "web-surface",
    ];
    for (const id of ids) {
      expect(parsed, `missing id ${id}`).toHaveProperty(id);
      const entry = parsed[id] as { status?: string };
      expect(typeof entry.status).toBe("string");
      expect(["ok", "timeout", "not_applicable", "error"]).toContain(entry.status);
    }
  }, 30_000);

  it("rejects denylisted domains like the per-check tools", async () => {
    const { DENYLIST } = await import("@/lib/dossier/denylist");
    const entry = [...DENYLIST][0];
    if (!entry) throw new Error("DENYLIST seed missing");
    const tool = findMcpTool("dossier_full");
    if (!tool) throw new Error("dossier_full not registered");
    const r = await tool.handler({ domain: entry });
    expect(r.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/mcp/dossier-full.test.ts`
Expected: FAIL with "dossier_full not registered".

- [ ] **Step 3: Implement the tool in `lib/mcp/tools.ts`**

Append a new entry to `rawMcpTools` (before `user_agent_parse`):

```ts
import { dossierChecks } from "@/lib/dossier/registry";

// ...inside rawMcpTools:
{
  name: "dossier_full",
  slug: "dossier-full", // virtual — no web tool entry; kept distinct so the
                         // slug-validation test in tools.test.ts can be updated.
  description:
    "Run all 10 dossier checks for a domain in parallel: dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, web-surface. Returns one JSON object keyed by check id, each value a CheckResult. Counts as ONE MCP call.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const results = await Promise.all(
      dossierChecks.map(async (c) => [c.id, await c.run(domain)] as const),
    );
    const payload: Record<string, unknown> = {};
    for (const [id, r] of results) payload[id] = r;
    return ok(JSON.stringify(payload, null, 2));
  },
},
```

And wrap it in the denylist wrapper — update the assembly line to include `dossier_full`:

```ts
const DENYLIST_GATED = new Set([
  "dossier_dns",
  "dossier_mx",
  "dossier_spf",
  "dossier_dmarc",
  "dossier_dkim",
  "dossier_tls",
  "dossier_redirects",
  "dossier_headers",
  "dossier_cors",
  "dossier_web_surface",
  "dossier_full",
]);

export const mcpTools: McpTool[] = rawMcpTools.map((t) =>
  withTracking(DENYLIST_GATED.has(t.name) ? withDenylist(t) : t),
);
```

(Replaces the `startsWith("dossier_")` heuristic from Task 9 with an explicit set — future dossier-shaped tools must opt in.)

- [ ] **Step 4: Update tool-count tests**

Edit `tests/unit/lib/mcp/tools.test.ts`:
- bump the count assertion from "exactly the 20 MCP tools" to "exactly the 21 MCP tools"
- add `"dossier_full"` to the sorted name array
- add `"dossier-full"` to the `validSlugs` set

- [ ] **Step 5: Run tests**

Run: `pnpm test tests/unit/lib/mcp`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add lib/mcp/tools.ts tests/unit/lib/mcp/tools.test.ts tests/unit/lib/mcp/dossier-full.test.ts
git commit -m "feat(mcp): dossier_full aggregate tool"
```

---

## Task 11: Sitemap regression test + README env vars

**Files:**
- Create: `tests/unit/app/sitemap.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/app/sitemap.test.ts
import sitemap from "@/app/sitemap";
import { describe, expect, it } from "vitest";

describe("sitemap", () => {
  it("does not include any /d/ dynamic dossier paths", () => {
    const entries = sitemap();
    for (const e of entries) {
      expect(e.url).not.toMatch(/\/d\//);
    }
  });

  it("includes every /tools/dossier-* slug", () => {
    const entries = sitemap().map((e) => e.url);
    const dossierSlugs = [
      "dossier-dns",
      "dossier-mx",
      "dossier-spf",
      "dossier-dmarc",
      "dossier-dkim",
      "dossier-tls",
      "dossier-redirects",
      "dossier-headers",
      "dossier-cors",
      "dossier-web-surface",
    ];
    for (const slug of dossierSlugs) {
      expect(entries.some((u) => u.endsWith(`/tools/${slug}`))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm test tests/unit/app/sitemap.test.ts`
Expected: PASS immediately (sitemap is already correct — this locks it in).

- [ ] **Step 3: Update README env-vars table**

Append rows to the env-vars table in `README.md`:

```md
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint (dossier rate limits) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
```

And add a new section immediately after the MCP section:

```md
## Dossier

- `/d/<domain>` streams 10 independent checks (DNS, MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface) as a single dossier.
- Append `?refresh=1` to bypass caches and revalidate that dossier load.
- Rate limits (per client IP): 30 `/d/<domain>` loads per hour, plus a separate 60/hour shared bucket across `/tools/dossier-*`. Unset Upstash env vars disable rate limiting (dev default).
- Abuse-prone targets are rejected at the route + MCP layer via a committed denylist in `lib/dossier/denylist.ts`.
```

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add tests/unit/app/sitemap.test.ts README.md
git commit -m "docs(dossier): document rate-limit env vars + denylist + refresh"
```

---

## Task 12: Lighthouse CI gate on `/d/example.com`

**Files:**
- Modify: `.lighthouserc.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the dossier URL to `.lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "startServerReadyPattern": "Ready in",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/tools/base64",
        "http://localhost:3000/tools/jwt",
        "http://localhost:3000/tools/dns",
        "http://localhost:3000/blog",
        "http://localhost:3000/blog/decode-jwt-without-verifying",
        "http://localhost:3000/d/example.com"
      ],
      "numberOfRuns": 1,
      "settings": {
        "preset": "desktop",
        "chromeFlags": "--no-sandbox --headless=new"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["warn", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 2: Add a `lighthouse` job to `.github/workflows/ci.yml`**

Append to the existing workflow:

```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm exec lhci autorun
        env:
          # Dossier rate-limit env vars intentionally unset —
          # the helper falls back to {allowed:true}.
          NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-report
          path: .lighthouseci/
          retention-days: 14
```

NOTE: `pnpm lh` script does `pnpm build && lhci autorun`; the CI job splits the steps so the build failure surfaces distinctly from the LHCI assertion failure. Do NOT remove the `pnpm lh` script — it stays the local equivalent.

- [ ] **Step 3: Local dry-run**

Run: `pnpm lh`
Expected: all 7 URLs score Performance ≥ 95 and SEO ≥ 95. If the new `/d/example.com` fails the perf gate, first investigate:
- `components/dossier/sections/*` doing avoidable client work (keep RSC; no `"use client"` on section roots)
- external fetches without explicit `cache:"no-store"` bypassing unstable_cache (should be rare after Task 5)
- Next.js streaming producing render-blocking flashes

Fixes must land in this task before merging.

- [ ] **Step 4: Commit**

```bash
git rev-parse --abbrev-ref HEAD
git add .lighthouserc.json .github/workflows/ci.yml
git commit -m "ci(dossier): gate /d/example.com on lighthouse perf/seo >= 95"
```

---

## Task 13: Final gate

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Unit tests**

Run: `pnpm test`
Expected: all pass. New test totals vs Plan 2:
- `+1` file: `denylist.test.ts` — 4 tests.
- `+1` file: `client-ip.test.ts` — 5 tests.
- `+1` file: `ratelimit.test.ts` — 3 tests.
- `+2` files: banner tests — 2 tests.
- `+1` file: `cache.test.ts` — 3 tests.
- `+1` file: `dossier-full.test.ts` — 3 tests.
- `+1` file: `sitemap.test.ts` — 2 tests.
- `tests/unit/lib/mcp/tools.test.ts` tool count bumped 20 → 21.
- `tests/unit/lib/mcp/dossier.test.ts` gains 1 denylist test.

- [ ] **Step 4: E2E**

Run: `pnpm test:e2e`
Expected: all pass, including new `?refresh=1` smoke.

- [ ] **Step 5: Lighthouse**

Run: `pnpm lh`
Expected: all 7 URLs pass.

- [ ] **Step 6: Build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 7: Manual smoke**

Run: `pnpm dev`.

Visits:
- `http://localhost:3000/d/stripe.com` — 10 sections stream in.
- `http://localhost:3000/d/stripe.com?refresh=1` — same, no errors in console.
- `http://localhost:3000/tools/dossier-dns?domain=stripe.com` — section renders.
- `http://localhost:3000/d/phishy-example-abuse.test` — denylist banner replaces sections.

- [ ] **Step 8: Commit any lint/format autofixes**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore(dossier): lint + format pass"
```

---

## Acceptance criteria

- `@upstash/redis` + `@upstash/ratelimit` added. `lib/rate-limit/ratelimit.ts` exposes `consumeDossier` and `consumeStandaloneDossier`; both no-op allow when `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is unset.
- `lib/dossier/denylist.ts` exports `DENYLIST` and `isDenied`, consulted at `/d/[domain]`, `/tools/dossier-*`, and every `dossier_*` MCP handler (including `dossier_full`).
- `lib/dossier/cache.ts` wraps every registry check with `unstable_cache`, keyed by `(id, domain)`, tagged `dossier:<id>:<domain>`, TTLs per the spec table above.
- `/d/[domain]?refresh=1` invalidates all 10 tags before rendering; `/tools/dossier-<id>?domain=<d>&refresh=1` invalidates just that one tag.
- `lib/mcp/tools.ts` registers `dossier_full`, bringing total tools to 21. `tests/unit/lib/mcp/tools.test.ts` asserts the new count and name.
- `.lighthouserc.json` includes `/d/example.com`; GitHub Actions `lighthouse` job enforces perf ≥ 95 and SEO ≥ 95.
- `app/sitemap.ts` continues to exclude `/d/*`; `tests/unit/app/sitemap.test.ts` locks it in.
- README documents the two Upstash env vars, the `?refresh=1` bypass, and the denylist.
- Lint, typecheck, unit, e2e, build, Lighthouse all pass.
