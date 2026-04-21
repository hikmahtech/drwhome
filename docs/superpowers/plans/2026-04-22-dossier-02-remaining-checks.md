# Domain Dossier — Plan 2: Remaining 9 checks (MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 9 dossier checks still missing after Plan 1, each as a pure function + section component + standalone `/tools/dossier-<check>` page + MCP tool, and surface all 10 sections on `/d/[domain]` via streamed `<Suspense>` boundaries.

**Architecture:** Each check follows the Plan 1 DNS template verbatim — pure async function returning `CheckResult<T>`, consumed by a server-component `<XxxSection>`, a standalone tool page, an MCP tool, and the flagship `/d/[domain]` route. Shared primitives (DoH helper, generic standalone form, generic skeleton) are extracted in Task 0 to keep every subsequent task mechanical.

**Tech stack:** existing — Next.js 15 App Router + TypeScript strict + Tailwind v4 + Vitest + Playwright + mcp-handler + zod. Two new runtime uses: `node:tls` (for TLS cert fetch) and Node `fetch` with `redirect: "manual"` (for redirect chain). No new npm dependencies.

**Reference spec:** `docs/superpowers/specs/2026-04-21-domain-dossier-design.md`

**Reference plan (pattern to copy):** `docs/superpowers/plans/2026-04-21-dossier-01-scaffolding-and-dns.md`

**Out of scope (Plan 3):**

- Upstash Redis rate limiting + denylist.
- `unstable_cache` per-check TTL layer and `?refresh=1` bypass.
- `dossier_full` aggregate MCP tool.
- Lighthouse audit + polish.

---

## Invariants reaffirmed

- Pure check logic in `lib/dossier/checks/*.ts`. UI in `components/dossier/sections/*.tsx`. Both web and MCP import the same pure fn. (CLAUDE.md)
- `content/tools.ts` is the single tool registry. Each check adds exactly one entry. (CLAUDE.md)
- Every new slug in `content/tools.ts` MUST have a matching entry in `content/tool-seo.ts` with >=3 howTo, >=2 examples, >=3 gotchas, >=5 faq, >=2 references — `tests/unit/content/tool-seo.test.ts` enforces this.
- Theme tokens in `app/globals.css` only. No hardcoded colors. (CLAUDE.md)
- Max width 680px, monospace everywhere, no shadows, radius <= 4px. (CLAUDE.md)
- Dynamic `params` and `searchParams` in Next.js 15 App Router are `Promise<...>` — always `await`.
- `typedRoutes: true` validates every `<Link href>` at build. New `/tools/dossier-<check>` slugs must exist before any link references them.
- Biome lints and formats. No `any`, no non-null assertions (`!`), no unused vars, no index-as-key, no template literals without interpolation.
- Tests live under `tests/unit/...` mirroring source tree. E2E under `tests/e2e/`.
- Commit messages: single-line conventional commits. No trailers. (Existing cmemory lesson about single-line drwho commits.)

---

## Worktree discipline (CRITICAL)

Plan 1 had one incident where an implementer subagent committed Task 5 to `main` instead of the worktree branch. Every implementer prompt in Plan 2 MUST begin with:

```
cd /Users/arshad/Workspace/hikmah/drwho/.claude/worktrees/dossier-plan-2
pwd   # expect .../.claude/worktrees/dossier-plan-2
git rev-parse --abbrev-ref HEAD   # expect worktree-dossier-plan-2
```

If either check fails, STOP and escalate — do NOT proceed with edits. Re-verify branch before EVERY `git commit`.

---

## File Structure

**Shared primitives (Task 0):**

- `lib/dossier/checks/_doh.ts` — tiny shared DoH helper: `dohFetch(name, type, {signal})` returns `{ok: true, answers: DohAnswer[]}` or `{ok: false, reason}`. Used by MX, SPF, DMARC, DKIM, and refactored from DNS.
- `components/dossier/sections/SectionSkeleton.tsx` — generic skeleton taking `title, toolSlug, domain, message`. The existing `DnsSectionSkeleton` is rewritten on top of this.
- `components/tools/DossierForm.tsx` — generic client form taking `slug, initial`. Replaces `DossierDnsForm`, which is deleted.

**Pure checks (Tasks 1-9):**

- `lib/dossier/checks/mx.ts`
- `lib/dossier/checks/spf.ts`
- `lib/dossier/checks/dmarc.ts`
- `lib/dossier/checks/dkim.ts`
- `lib/dossier/checks/tls.ts`
- `lib/dossier/checks/redirects.ts`
- `lib/dossier/checks/headers.ts`
- `lib/dossier/checks/cors.ts`
- `lib/dossier/checks/web-surface.ts`

**Section components (Tasks 1-9):**

- `components/dossier/sections/MxSection.tsx`
- `components/dossier/sections/SpfSection.tsx`
- `components/dossier/sections/DmarcSection.tsx`
- `components/dossier/sections/DkimSection.tsx`
- `components/dossier/sections/TlsSection.tsx`
- `components/dossier/sections/RedirectsSection.tsx`
- `components/dossier/sections/HeadersSection.tsx`
- `components/dossier/sections/CorsSection.tsx`
- `components/dossier/sections/WebSurfaceSection.tsx`

**Standalone tool components (Tasks 1-9):**

- `components/tools/DossierMx.tsx`, `DossierSpf.tsx`, `DossierDmarc.tsx`, `DossierDkim.tsx`, `DossierTls.tsx`, `DossierRedirects.tsx`, `DossierHeaders.tsx`, `DossierCors.tsx`, `DossierWebSurface.tsx` — each a server component wiring `<DossierForm slug="...">` + `<Suspense fallback={<SectionSkeleton>}><XxxSection domain={domain} /></Suspense>`.

**Modified each task:**

- `content/tools.ts` — add one entry.
- `content/tool-seo.ts` — add one entry meeting the 3/2/3/5/2 floor.
- `lib/dossier/registry.ts` — add to `dossierChecks[]`, widen `DossierCheckId` union.
- `lib/mcp/tools.ts` — add one tool entry.
- `tests/unit/lib/mcp/tools.test.ts` — bump expected tool count, add slug to expected names.

**Task 10 modifications:**

- `app/d/[domain]/page.tsx` — mount 9 more `<Suspense>` wrappers in the order specified by the design spec.
- `tests/e2e/dossier.spec.ts` — assert all 10 sections reach a terminal state.

---

## Task 0: Shared primitives

**Files:**
- Create: `lib/dossier/checks/_doh.ts`
- Create: `tests/unit/lib/dossier/checks/_doh.test.ts`
- Create: `components/tools/DossierForm.tsx`
- Create: `components/dossier/sections/SectionSkeleton.tsx`
- Modify: `components/tools/DossierDnsForm.tsx` (delete, replaced by generic)
- Modify: `components/tools/DossierDns.tsx` (use `DossierForm`)
- Modify: `components/dossier/sections/DnsSectionSkeleton.tsx` (use `SectionSkeleton`)
- Modify: `lib/dossier/checks/dns.ts` (use `dohFetch`)

- [ ] **Step 1: Write failing test for `_doh.ts`**

```ts
// tests/unit/lib/dossier/checks/_doh.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { dohFetch } from "@/lib/dossier/checks/_doh";

describe("dohFetch", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns answers on upstream ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 16, TTL: 60, data: '"v=spf1 -all"' },
          { name: "example.com.", type: 16, TTL: 60, data: '"another"' },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toHaveLength(2);
      expect(r.answers[0].data).toBe('"v=spf1 -all"');
    }
  });

  it("returns ok with empty answers on NOERROR plus no Answer key", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0 }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.answers).toEqual([]);
  });

  it("returns not-ok on non-200 upstream", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    const r = await dohFetch("example.com", "TXT");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/500/);
  });

  it("returns not-ok on non-zero DoH Status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 3 }),
    }) as unknown as typeof fetch;

    const r = await dohFetch("nope.example", "TXT");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/status 3/i);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test tests/unit/lib/dossier/checks/_doh.test.ts`

- [ ] **Step 3: Implement `_doh.ts`**

```ts
// lib/dossier/checks/_doh.ts
export type DohAnswer = { name: string; type: number; TTL: number; data: string };

export type DohResult =
  | { ok: true; answers: DohAnswer[] }
  | { ok: false; reason: string };

type DohBody = { Status: number; Answer?: DohAnswer[] };

export async function dohFetch(
  name: string,
  type: string,
  init: { signal?: AbortSignal } = {},
): Promise<DohResult> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: init.signal,
  });
  if (!res.ok) return { ok: false, reason: `upstream ${res.status}` };
  const body = (await res.json()) as DohBody;
  if (body.Status !== 0) return { ok: false, reason: `doh status ${body.Status}` };
  return { ok: true, answers: body.Answer ?? [] };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm test tests/unit/lib/dossier/checks/_doh.test.ts`

- [ ] **Step 5: Refactor `dnsCheck` to use `dohFetch`**

Replace the inline DoH call inside the parallel map in `lib/dossier/checks/dns.ts` with `dohFetch(v.domain, type, { signal: controller.signal })`. Keep timeout semantics identical. Existing DNS tests must still pass.

Updated `lib/dossier/checks/dns.ts`:

```ts
import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export const DNS_DOSSIER_TYPES = ["A", "AAAA", "NS", "SOA", "CAA", "TXT"] as const;
export type DnsDossierType = (typeof DNS_DOSSIER_TYPES)[number];

export type DnsAnswer = { name: string; type: number; TTL: number; data: string };
export type DnsCheckData = { records: Record<DnsDossierType, DnsAnswer[]> };

const DEFAULT_TIMEOUT_MS = 5_000;

export async function dnsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<DnsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const queries = DNS_DOSSIER_TYPES.map(async (type) => {
      const r = await dohFetch(v.domain, type, { signal: controller.signal });
      if (!r.ok) throw new Error(`${type}: ${r.reason}`);
      return [type, r.answers] as const;
    });

    const settled = await Promise.all(queries);
    clearTimeout(timer);

    const records = Object.fromEntries(settled) as Record<DnsDossierType, DnsAnswer[]>;
    const totalAnswers = Object.values(records).reduce((a, b) => a + b.length, 0);
    if (totalAnswers === 0) return { status: "not_applicable", reason: "no DNS records found" };
    return { status: "ok", data: { records }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

Run: `pnpm test tests/unit/lib/dossier/checks/dns.test.ts` — expect PASS.

- [ ] **Step 6: Implement generic `DossierForm` + delete `DossierDnsForm`**

Create `components/tools/DossierForm.tsx`:

```tsx
"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DossierForm({ slug, initial }: { slug: string; initial: string }) {
  const router = useRouter();
  const [input, setInput] = useState(initial);
  const [, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = input.trim();
        if (!q) return;
        start(() => router.push(`/tools/${slug}?domain=${encodeURIComponent(q)}` as Route));
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        name="domain"
        aria-label="domain"
        placeholder="example.com"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 bg-bg border px-2 py-1 text-sm"
      />
      <button type="submit" className="border px-3 py-1 text-sm">
        run
      </button>
    </form>
  );
}
```

Delete `components/tools/DossierDnsForm.tsx`. Update `components/tools/DossierDns.tsx`:

```tsx
import { Suspense } from "react";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";

export function DossierDns({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-dns" initial={domain ?? ""} />
      {domain && (
        <Suspense fallback={<DnsSectionSkeleton domain={domain} />}>
          <DnsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Implement generic `SectionSkeleton` and redefine `DnsSectionSkeleton` on top of it**

Create `components/dossier/sections/SectionSkeleton.tsx`:

```tsx
import { CheckSection } from "@/components/dossier/CheckSection";

export function SectionSkeleton({
  title,
  toolSlug,
  domain,
  message = "loading…",
}: {
  title: string;
  toolSlug: string;
  domain: string;
  message?: string;
}) {
  return (
    <CheckSection title={title} toolSlug={toolSlug} domain={domain} status="not_applicable">
      <p className="text-muted">{message}</p>
    </CheckSection>
  );
}
```

Rewrite `components/dossier/sections/DnsSectionSkeleton.tsx`:

```tsx
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";

export function DnsSectionSkeleton({ domain }: { domain: string }) {
  return <SectionSkeleton title="dns" toolSlug="dossier-dns" domain={domain} message="resolving…" />;
}
```

- [ ] **Step 8: Run full unit suite**

Run: `pnpm test`
Expected: all Plan 1 tests still pass; new `_doh.test.ts` passes.

- [ ] **Step 9: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/dossier/checks/_doh.ts tests/unit/lib/dossier/checks/_doh.test.ts lib/dossier/checks/dns.ts components/tools/DossierForm.tsx components/tools/DossierDns.tsx components/dossier/sections/SectionSkeleton.tsx components/dossier/sections/DnsSectionSkeleton.tsx
git rm components/tools/DossierDnsForm.tsx
git rev-parse --abbrev-ref HEAD   # expect worktree-dossier-plan-2
git commit -m "refactor(dossier): extract dohFetch + generic DossierForm + SectionSkeleton"
```

---

## Task template (applies to Tasks 1-9)

Every check task has the same 12-step shape. Task 1 (MX) spells every step out. Later tasks follow the exact same structure and only the **check-specific code** is new. If a later task does not spell out a step, copy the shape from Task 1 verbatim.

1. Write failing unit test for pure check function.
2. Run the unit test (expect FAIL).
3. Implement the pure check function.
4. Run the unit test (expect PASS).
5. Add the check to `lib/dossier/registry.ts` (widen `DossierCheckId` union, append to `dossierChecks[]`).
6. Write failing RTL test for the section component (covers `ok`, `error`, `not_applicable`, `timeout`).
7. Implement the `<XxxSection>` server component. No check-specific skeleton — the dossier page uses the generic `SectionSkeleton`.
8. Run the RTL test (expect PASS).
9. Implement the standalone tool component `components/tools/Dossier<Xxx>.tsx`.
10. Register in `content/tools.ts` and `content/tool-seo.ts`.
11. Add the MCP tool to `lib/mcp/tools.ts`. Bump the expected tool count in `tests/unit/lib/mcp/tools.test.ts`. Append an MCP handler test to `tests/unit/lib/mcp/dossier.test.ts`.
12. Run `pnpm lint && pnpm typecheck && pnpm test`. Commit.

The check is NOT wired into `/d/[domain]/page.tsx` during its own task — Task 10 wires all 9 at once.

---

## Task 1: MX check

**Files:**
- Create: `lib/dossier/checks/mx.ts`
- Create: `tests/unit/lib/dossier/checks/mx.test.ts`
- Create: `components/dossier/sections/MxSection.tsx`
- Create: `tests/unit/components/dossier/sections/MxSection.test.tsx`
- Create: `components/tools/DossierMx.tsx`
- Modify: `lib/dossier/registry.ts`, `content/tools.ts`, `content/tool-seo.ts`, `lib/mcp/tools.ts`, `tests/unit/lib/mcp/tools.test.ts`, `tests/unit/lib/mcp/dossier.test.ts`

- [ ] **Step 1: Write failing unit test**

```ts
// tests/unit/lib/dossier/checks/mx.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { mxCheck } from "@/lib/dossier/checks/mx";

describe("mxCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns error for invalid domain", async () => {
    const r = await mxCheck("not a domain");
    expect(r.status).toBe("error");
  });

  it("returns ok with sorted MX records", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 15, TTL: 300, data: "20 backup.example.com." },
          { name: "example.com.", type: 15, TTL: 300, data: "10 primary.example.com." },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.records).toEqual([
        { priority: 10, exchange: "primary.example.com." },
        { priority: 20, exchange: "backup.example.com." },
      ]);
    }
  });

  it("returns not_applicable when no MX records", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("not_applicable");
  });

  it("returns error when DoH upstream fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 } as Response) as unknown as typeof fetch;
    const r = await mxCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout on hanging fetch", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    const r = await mxCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  });

  it("skips malformed MX rdata without failing the whole check", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 15, TTL: 300, data: "10 primary.example.com." },
          { name: "example.com.", type: 15, TTL: 300, data: "garbage" },
        ],
      }),
    }) as unknown as typeof fetch;

    const r = await mxCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.records).toEqual([{ priority: 10, exchange: "primary.example.com." }]);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test tests/unit/lib/dossier/checks/mx.test.ts`

- [ ] **Step 3: Implement `mxCheck`**

```ts
// lib/dossier/checks/mx.ts
import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type MxRecord = { priority: number; exchange: string };
export type MxCheckData = { records: MxRecord[] };

const DEFAULT_TIMEOUT_MS = 5_000;

export async function mxCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<MxCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(v.domain, "MX", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };
    if (r.answers.length === 0) return { status: "not_applicable", reason: "no MX records" };

    const records: MxRecord[] = [];
    for (const a of r.answers) {
      const parts = a.data.trim().split(/\s+/);
      if (parts.length < 2) continue;
      const priority = Number.parseInt(parts[0], 10);
      if (!Number.isFinite(priority)) continue;
      records.push({ priority, exchange: parts.slice(1).join(" ") });
    }
    if (records.length === 0) return { status: "not_applicable", reason: "no parseable MX records" };

    records.sort((a, b) => a.priority - b.priority);
    return { status: "ok", data: { records }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm test tests/unit/lib/dossier/checks/mx.test.ts`

- [ ] **Step 5: Register in `lib/dossier/registry.ts`**

```ts
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { mxCheck } from "@/lib/dossier/checks/mx";
import type { CheckResult } from "@/lib/dossier/types";

export type DossierCheckId = "dns" | "mx";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string;
  run: (domain: string) => Promise<CheckResult<unknown>>;
};

export const dossierChecks: DossierCheck[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", run: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "dossier-mx", run: mxCheck },
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
```

- [ ] **Step 6: Write failing RTL test for section**

```tsx
// tests/unit/components/dossier/sections/MxSection.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MxSection } from "@/components/dossier/sections/MxSection";

vi.mock("@/lib/dossier/checks/mx", () => ({ mxCheck: vi.fn() }));
import { mxCheck } from "@/lib/dossier/checks/mx";

describe("MxSection", () => {
  it("renders sorted records on ok", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-22T00:00:00Z",
      data: {
        records: [
          { priority: 10, exchange: "primary.example.com." },
          { priority: 20, exchange: "backup.example.com." },
        ],
      },
    });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/primary\.example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/backup\.example\.com/)).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders not_applicable reason", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "not_applicable", reason: "no MX records" });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no MX records/)).toBeInTheDocument();
  });

  it("renders error message", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "error", message: "boom" });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (mxCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "timeout", ms: 5000 });
    const ui = await MxSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Implement `MxSection`**

```tsx
// components/dossier/sections/MxSection.tsx
import { CheckSection } from "@/components/dossier/CheckSection";
import { mxCheck } from "@/lib/dossier/checks/mx";

export async function MxSection({ domain }: { domain: string }) {
  const r = await mxCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="ok" fetchedAt={r.fetchedAt}>
      <ul className="list-none p-0 space-y-1">
        {r.data.records.map((m) => (
          <li key={`${m.priority}-${m.exchange}`} className="break-all">
            <span className="text-muted">pri={m.priority} </span>
            {m.exchange}
          </li>
        ))}
      </ul>
    </CheckSection>
  );
}
```

- [ ] **Step 8: Run RTL test — expect PASS**

Run: `pnpm test tests/unit/components/dossier/sections/MxSection.test.tsx`

- [ ] **Step 9: Implement standalone tool component**

```tsx
// components/tools/DossierMx.tsx
import { Suspense } from "react";
import { MxSection } from "@/components/dossier/sections/MxSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";

export function DossierMx({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-mx" initial={domain ?? ""} />
      {domain && (
        <Suspense fallback={<SectionSkeleton title="mx" toolSlug="dossier-mx" domain={domain} message="resolving…" />}>
          <MxSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Register in `content/tools.ts` and `content/tool-seo.ts`**

`content/tools.ts`:

```ts
import { DossierMx } from "@/components/tools/DossierMx";
// ...
{
  slug: "dossier-mx",
  name: "dossier / mx",
  description: "list the mail exchangers (MX records) a domain advertises, sorted by priority.",
  category: "network",
  keywords: ["mx", "mail", "dossier", "exchange", "email", "smtp"],
  component: DossierMx,
  mcpNames: ["dossier_mx"],
},
```

`content/tool-seo.ts` (append before the closing `};` of `toolContent`):

```ts
"dossier-mx": {
  lead: "list the mail exchangers (MX records) a domain advertises, sorted by priority.",
  overview:
    "mx records tell senders which smtp servers handle email for a domain. lower priority numbers win; multiple hosts at the same priority load-balance. this tool resolves the mx rrset via cloudflare's doh resolver, parses each record into (priority, exchange) pairs, and returns them sorted. it is part of the drwho.me domain dossier — the same result appears as the mx section at `/d/<domain>` and as the `dossier_mx` mcp tool.",
  howTo: [
    { step: "enter a bare domain", detail: "public fqdn only. no schemes, ports, paths." },
    { step: "run the check", detail: "a single mx doh query against cloudflare's resolver." },
    { step: "read the priority list", detail: "lower priority is tried first. ties load-balance." },
  ],
  examples: [
    { input: "gmail.com", output: "pri=5 gmail-smtp-in.l.google.com. · pri=10 alt1.gmail-smtp-in.l.google.com.", note: "google workspace mx set." },
    { input: "protonmail.com", output: "pri=10 mail.protonmail.ch. · pri=20 mailsec.protonmail.ch.", note: "primary + backup pattern." },
  ],
  gotchas: [
    { title: "no mx = no inbound smtp", body: "a domain with zero mx records can still send email, but cannot receive smtp traffic. the check reports not_applicable in that case." },
    { title: "null mx (RFC 7505)", body: 'a single record of priority 0 pointing to "." signals "this domain does not accept mail". the tool shows it verbatim.' },
    { title: "mx aliases", body: "mx exchanges must be a hostname (A/AAAA), not a CNAME. some domains get this wrong; the dossier does not currently flag it — cross-reference with the dns section if a recipient bounces." },
  ],
  faq: [
    { q: "why is there an mx section and a dns section?", a: "dns covers A/AAAA/NS/SOA/CAA/TXT. mx gets its own section because it's the entry point to the email-auth cluster and the ordered priority view is specific to mail." },
    { q: "can i send mail without mx?", a: "yes, you can send — but you cannot receive. senders consult the recipient's mx, not yours." },
    { q: "does this resolve the A/AAAA of each mx host?", a: "no. that is a second hop; use the dns tool or the dns section of a dossier for each entry if you need the address set." },
    { q: "why is cloudflare resolving this and not google?", a: "cloudflare's doh responds fast and returns structured json. no tracking headers are added. the choice has no effect on the answer — mx is an authoritative record type." },
    { q: "can i look up mx for an ip?", a: "no. mx is a domain-level record. ip-level lookups belong in the ip-lookup tool." },
  ],
  related: ["dns", "dossier-dns"],
  references: [
    { title: "RFC 5321 — SMTP", url: "https://www.rfc-editor.org/rfc/rfc5321" },
    { title: "RFC 7505 — null MX", url: "https://www.rfc-editor.org/rfc/rfc7505" },
  ],
},
```

- [ ] **Step 11: Add MCP tool + test**

Edit `lib/mcp/tools.ts`:

- Add import: `import { mxCheck } from "@/lib/dossier/checks/mx";`
- Append to `rawMcpTools[]`:

```ts
{
  name: "dossier_mx",
  slug: "dossier-mx",
  description: "Return the MX records for a domain, sorted by priority, as a CheckResult discriminated union.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await mxCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Edit `tests/unit/lib/mcp/tools.test.ts`: bump expected tool count from **11** to **12**. Add `"dossier_mx"` to any per-name assertions.

Append to `tests/unit/lib/mcp/dossier.test.ts`:

```ts
it("dossier_mx returns CheckResult ok on success", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      Status: 0,
      Answer: [{ name: "example.com.", type: 15, TTL: 300, data: "10 mail.example.com." }],
    }),
  }) as unknown as typeof fetch;
  const { findMcpTool } = await import("@/lib/mcp/tools");
  const tool = findMcpTool("dossier_mx");
  expect(tool).toBeDefined();
  if (!tool) throw new Error("tool missing");
  const r = await tool.handler({ domain: "example.com" });
  expect(r.isError).toBeFalsy();
  const parsed = JSON.parse(r.content[0].text);
  expect(parsed.status).toBe("ok");
});
```

- [ ] **Step 12: Lint, typecheck, test, commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add lib/dossier/checks/mx.ts tests/unit/lib/dossier/checks/mx.test.ts components/dossier/sections/MxSection.tsx tests/unit/components/dossier/sections/MxSection.test.tsx components/tools/DossierMx.tsx lib/dossier/registry.ts content/tools.ts content/tool-seo.ts lib/mcp/tools.ts tests/unit/lib/mcp/tools.test.ts tests/unit/lib/mcp/dossier.test.ts
git rev-parse --abbrev-ref HEAD   # expect worktree-dossier-plan-2
git commit -m "feat(dossier): mx check"
```

---

## Task 2: SPF check

**Files:** `lib/dossier/checks/spf.ts`, tests, section, standalone, registry, content, MCP.

Follow the 12-step template from Task 1. Check-specific code follows.

- [ ] **Step 1+3: Test + implementation**

Test:

```ts
// tests/unit/lib/dossier/checks/spf.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { spfCheck } from "@/lib/dossier/checks/spf";

describe("spfCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain", async () => {
    expect((await spfCheck("nope")).status).toBe("error");
  });

  it("returns ok with the spf record concatenated from quoted segments", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 16, TTL: 300, data: '"v=spf1 include:_spf.google.com " "-all"' },
          { name: "example.com.", type: 16, TTL: 300, data: '"unrelated=foo"' },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await spfCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.record).toBe("v=spf1 include:_spf.google.com -all");
      expect(r.data.mechanisms).toEqual(["v=spf1", "include:_spf.google.com", "-all"]);
    }
  });

  it("returns not_applicable when no spf record", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [{ name: "example.com.", type: 16, TTL: 300, data: '"unrelated=foo"' }],
      }),
    }) as unknown as typeof fetch;
    expect((await spfCheck("example.com")).status).toBe("not_applicable");
  });

  it("returns error when multiple spf records found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 16, TTL: 300, data: '"v=spf1 -all"' },
          { name: "example.com.", type: 16, TTL: 300, data: '"v=spf1 +all"' },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await spfCheck("example.com");
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toMatch(/multiple/i);
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await spfCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });
});
```

Implementation:

```ts
// lib/dossier/checks/spf.ts
import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type SpfCheckData = { record: string; mechanisms: string[] };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  // DoH returns TXT as quoted segments separated by whitespace: '"seg1" "seg2"'.
  // Strip surrounding quotes, join inter-segment whitespace away.
  return txt
    .split(/"\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

export async function spfCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<SpfCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(v.domain, "TXT", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };

    const matches = r.answers
      .map((a) => unquote(a.data))
      .filter((s) => /^v=spf1(\s|$)/i.test(s));

    if (matches.length === 0) return { status: "not_applicable", reason: "no SPF record" };
    if (matches.length > 1) {
      return { status: "error", message: `multiple SPF records found (${matches.length}); RFC 7208 forbids this` };
    }

    const record = matches[0];
    const mechanisms = record.split(/\s+/).filter(Boolean);
    return { status: "ok", data: { record, mechanisms }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen `DossierCheckId` to `"dns" | "mx" | "spf"`. Append `{ id: "spf", title: "spf", toolSlug: "dossier-spf", run: spfCheck }`.

- [ ] **Step 6+7: `SpfSection`**

RTL test mirrors `MxSection.test.tsx`. Section component:

```tsx
// components/dossier/sections/SpfSection.tsx
import { CheckSection } from "@/components/dossier/CheckSection";
import { spfCheck } from "@/lib/dossier/checks/spf";

export async function SpfSection({ domain }: { domain: string }) {
  const r = await spfCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  return (
    <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="ok" fetchedAt={r.fetchedAt}>
      <p className="break-all">{r.data.record}</p>
      <ul className="list-none p-0 mt-2 space-y-1 text-muted">
        {r.data.mechanisms.map((m) => (
          <li key={m} className="break-all">{m}</li>
        ))}
      </ul>
    </CheckSection>
  );
}
```

- [ ] **Step 9: `DossierSpf`** — mirror `DossierMx` with slug `dossier-spf` and section `SpfSection`.

- [ ] **Step 10: Registry + content**

`content/tools.ts`:

```ts
{
  slug: "dossier-spf",
  name: "dossier / spf",
  description: "find and parse a domain's SPF (sender policy framework) record.",
  category: "network",
  keywords: ["spf", "dossier", "email", "authentication", "sender"],
  component: DossierSpf,
  mcpNames: ["dossier_spf"],
},
```

`content/tool-seo.ts` entry `"dossier-spf"`: lead = "find and parse a domain's SPF (sender policy framework) record. part of the drwho.me domain dossier." Overview covers RFC 7208, mechanism semantics (include, a, mx, ip4, ip6, all qualifiers). Include >=3 howTo, >=2 examples (google.com -> `v=spf1 include:_spf.google.com ~all`), >=3 gotchas (multiple records forbidden; 10-DNS-lookup limit; `~all` vs `-all` vs `?all`; spf cannot cover From header — that's dmarc's job), >=5 faq, >=2 references (RFC 7208; dmarc.org SPF guide).

- [ ] **Step 11: MCP**

```ts
import { spfCheck } from "@/lib/dossier/checks/spf";
// ...
{
  name: "dossier_spf",
  slug: "dossier-spf",
  description: "Return the SPF record for a domain, parsed into mechanisms, as a CheckResult discriminated union.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await spfCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **13**. Append `dossier_spf` MCP handler test mirroring `dossier_mx`'s.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): spf check"
```

---

## Task 3: DMARC check

**Files:** `lib/dossier/checks/dmarc.ts`, tests, section, standalone, registry, content, MCP.

DMARC TXT lives at `_dmarc.<domain>`, not at apex. Single record (RFC 7489). Parse `v=DMARC1; p=...; rua=...; ...` into a tag->value map.

- [ ] **Step 1+3**

Test mirrors SPF's (replace queried name with `_dmarc.example.com`). Cases: valid record -> parsed tags; no record -> `not_applicable`; multiple -> `error`; invalid domain -> `error`; timeout.

```ts
// lib/dossier/checks/dmarc.ts
import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type DmarcCheckData = { record: string; tags: Record<string, string> };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  return txt.split(/"\s*"/).map((s) => s.replace(/^"|"$/g, "")).join("");
}

function parseTags(record: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

export async function dmarcCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<DmarcCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await dohFetch(`_dmarc.${v.domain}`, "TXT", { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) return { status: "error", message: r.reason };

    const matches = r.answers
      .map((a) => unquote(a.data))
      .filter((s) => /^v=DMARC1(;|\s|$)/i.test(s));

    if (matches.length === 0) return { status: "not_applicable", reason: "no DMARC record" };
    if (matches.length > 1) {
      return { status: "error", message: `multiple DMARC records found (${matches.length}); RFC 7489 forbids this` };
    }
    const record = matches[0];
    return { status: "ok", data: { record, tags: parseTags(record) }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "dmarc"`.

- [ ] **Step 6+7: `DmarcSection`** — mirror `SpfSection`, but render `tags` as a `<dl>` of k=v pairs (`p`, `rua`, `ruf`, `sp`, `pct`, `adkim`, `aspf`, `fo`).

- [ ] **Step 9: `DossierDmarc`** — mirror `DossierSpf`.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-dmarc",
  name: "dossier / dmarc",
  description: "find and parse a domain's DMARC policy record at _dmarc.<domain>.",
  category: "network",
  keywords: ["dmarc", "dossier", "email", "authentication", "policy"],
  component: DossierDmarc,
  mcpNames: ["dossier_dmarc"],
},
```

`content/tool-seo.ts` `"dossier-dmarc"`: overview covers `p=none/quarantine/reject`, alignment (`adkim`, `aspf`), reporting (`rua`, `ruf`), `pct` gradual rollout. >=3 howTo, >=2 examples (google.com, microsoft.com), >=3 gotchas (dmarc requires spf OR dkim to align; `p=none` is monitor-only; `rua`/`ruf` mailboxes must accept external-domain reports or publish an authorisation record), >=5 faq, >=2 refs (RFC 7489, RFC 8617 ARC).

- [ ] **Step 11: MCP** — `dossier_dmarc`. Bump tool count to **14**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): dmarc check"
```

---

## Task 4: DKIM check

**Files:** `lib/dossier/checks/dkim.ts`, tests, section, standalone, registry, content, MCP.

DKIM records live at `<selector>._domainkey.<domain>`. v1 probes a fixed list of common selectors in parallel: `["default", "google", "k1", "selector1", "selector2", "mxvault"]`. An optional `selectors` array overrides. The section displays one row per tested selector with status `found / not_found`. The MCP tool exposes the optional `selectors` input.

- [ ] **Step 1+3**

```ts
// tests/unit/lib/dossier/checks/dkim.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DKIM_SELECTORS, dkimCheck } from "@/lib/dossier/checks/dkim";

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
          Answer: isGoogle
            ? [{ name, type: 16, TTL: 60, data: '"v=DKIM1; k=rsa; p=ABCDEF"' }]
            : [],
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
  });

  it("returns not_applicable when no selector has a record", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;
    expect((await dkimCheck("example.com")).status).toBe("not_applicable");
  });

  it("honours a caller-supplied selector list", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ name: "x._domainkey.example.com.", type: 16, TTL: 60, data: '"v=DKIM1; p=Z"' }] }),
    }) as unknown as typeof fetch;
    const r = await dkimCheck("example.com", { selectors: ["x"] });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.selectors).toEqual([
        expect.objectContaining({ selector: "x", status: "found" }),
      ]);
    }
  });

  it("returns timeout on hanging fetch", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await dkimCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });

  it("rejects invalid domain", async () => {
    expect((await dkimCheck("nope")).status).toBe("error");
  });
});
```

```ts
// lib/dossier/checks/dkim.ts
import { dohFetch } from "@/lib/dossier/checks/_doh";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export const DEFAULT_DKIM_SELECTORS = [
  "default",
  "google",
  "k1",
  "selector1",
  "selector2",
  "mxvault",
] as const;

export type DkimSelectorResult =
  | { selector: string; status: "found"; record: string }
  | { selector: string; status: "not_found" };

export type DkimCheckData = { selectors: DkimSelectorResult[] };

const DEFAULT_TIMEOUT_MS = 5_000;

function unquote(txt: string): string {
  return txt.split(/"\s*"/).map((s) => s.replace(/^"|"$/g, "")).join("");
}

export async function dkimCheck(
  rawDomain: string,
  opts: { selectors?: readonly string[]; timeoutMs?: number } = {},
): Promise<CheckResult<DkimCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const selectors = opts.selectors ?? DEFAULT_DKIM_SELECTORS;
  if (selectors.length === 0) return { status: "error", message: "no selectors to probe" };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const probes = selectors.map(async (selector): Promise<DkimSelectorResult> => {
      const r = await dohFetch(`${selector}._domainkey.${v.domain}`, "TXT", { signal: controller.signal });
      if (!r.ok) return { selector, status: "not_found" };
      const match = r.answers.map((a) => unquote(a.data)).find((s) => /(^|;\s*)v=DKIM1/i.test(s) || /^p=/i.test(s));
      if (!match) return { selector, status: "not_found" };
      return { selector, status: "found", record: match };
    });
    const results = await Promise.all(probes);
    clearTimeout(timer);
    const anyFound = results.some((r) => r.status === "found");
    if (!anyFound) {
      return { status: "not_applicable", reason: `no DKIM record on probed selectors (${selectors.join(", ")})` };
    }
    return { status: "ok", data: { selectors: results }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "dkim"`.

- [ ] **Step 6+7: `DkimSection`** — render each selector with a badge (`found` = accent, `not_found` = muted). For `found`, display the record (truncated if long).

- [ ] **Step 9: `DossierDkim`** — mirror `DossierSpf`.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-dkim",
  name: "dossier / dkim",
  description: "probe common DKIM selectors (default, google, k1, selector1/2, mxvault) for a domain.",
  category: "network",
  keywords: ["dkim", "dossier", "email", "authentication", "selector", "domainkey"],
  component: DossierDkim,
  mcpNames: ["dossier_dkim"],
},
```

`content/tool-seo.ts` `"dossier-dkim"`: overview explains selector convention, default selector list, how to find an unlisted one (inspect a recent email's `DKIM-Signature: s=` tag). >=3 howTo, >=2 examples (gmail.com -> `google` selector; mailchimp.com -> `k1`), >=3 gotchas (no public-DNS selector discovery; key rotation means old selectors linger; CNAMEs to an email provider's selector are common), >=5 faq (including "can i supply a selector?" — yes, via `dossier_dkim(domain, selectors=[...])`), >=2 refs (RFC 6376, RFC 8301).

- [ ] **Step 11: MCP**

```ts
import { dkimCheck } from "@/lib/dossier/checks/dkim";
// ...
{
  name: "dossier_dkim",
  slug: "dossier-dkim",
  description: "Probe DKIM selectors for a domain. Defaults to common selectors (default, google, k1, selector1, selector2, mxvault). Supply `selectors` to probe a custom list. Returns a CheckResult.",
  inputSchema: {
    domain: z.string().describe("Public FQDN."),
    selectors: z
      .array(z.string())
      .optional()
      .describe("Optional custom selector list. If omitted, probes the common-selectors set."),
  },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const sel = (input as { selectors?: unknown }).selectors;
    const selectors = Array.isArray(sel) && sel.every((s) => typeof s === "string")
      ? (sel as string[])
      : undefined;
    const r = await dkimCheck(domain, selectors ? { selectors } : {});
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **15**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): dkim check with common-selector probe"
```

---

## Task 5: TLS check

**Files:** `lib/dossier/checks/tls.ts`, tests, section, standalone, registry, content, MCP.

TLS needs a raw TCP connection, not fetch. Use Node's built-in `node:tls` to open a socket on port 443, read the server's peer certificate, extract subject / issuer / validity / SAN, and close.

**Runtime note:** Any route importing this file runs on the Node runtime (not Edge). Next.js 15 routes auto-switch when they see `node:` imports. Confirm with `pnpm build` — both `/tools/dossier-tls` and `/d/[domain]` should render as dynamic Node-runtime routes.

- [ ] **Step 1+3: `tlsCheck`**

Test mocks `node:tls` `connect`:

```ts
// tests/unit/lib/dossier/checks/tls.test.ts
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

type PeerCert = {
  subject?: { CN?: string; O?: string };
  issuer?: { CN?: string; O?: string };
  valid_from: string;
  valid_to: string;
  subjectaltname?: string;
  fingerprint256?: string;
};

class FakeSocket extends EventEmitter {
  authorized = true;
  authorizationError: Error | null = null;
  private peerCert: PeerCert;
  constructor(peerCert: PeerCert) {
    super();
    this.peerCert = peerCert;
  }
  getPeerCertificate() {
    return this.peerCert;
  }
  end() {}
  setTimeout() {}
  destroy() {
    this.emit("close");
  }
}

const mockConnect = vi.fn();
vi.mock("node:tls", () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
}));

import { tlsCheck } from "@/lib/dossier/checks/tls";

describe("tlsCheck", () => {
  afterEach(() => {
    mockConnect.mockReset();
  });

  it("rejects invalid domain", async () => {
    expect((await tlsCheck("nope")).status).toBe("error");
  });

  it("returns ok with cert fields on successful handshake", async () => {
    const peerCert: PeerCert = {
      subject: { CN: "example.com" },
      issuer: { CN: "Some CA", O: "Some CA Inc" },
      valid_from: "Jan  1 00:00:00 2026 GMT",
      valid_to: "Jan  1 00:00:00 2027 GMT",
      subjectaltname: "DNS:example.com, DNS:www.example.com",
      fingerprint256: "AA:BB:CC",
    };
    const sock = new FakeSocket(peerCert);
    mockConnect.mockImplementation((_opts, cb: () => void) => {
      queueMicrotask(() => cb());
      return sock;
    });

    const r = await tlsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.subject.CN).toBe("example.com");
      expect(r.data.sans).toEqual(["example.com", "www.example.com"]);
      expect(r.data.validFrom).toBe("Jan  1 00:00:00 2026 GMT");
      expect(r.data.validTo).toBe("Jan  1 00:00:00 2027 GMT");
      expect(r.data.fingerprint256).toBe("AA:BB:CC");
      expect(r.data.authorized).toBe(true);
    }
  });

  it("returns ok with authorized=false when handshake reports auth error", async () => {
    const sock = new FakeSocket({
      subject: {},
      issuer: {},
      valid_from: "",
      valid_to: "",
    });
    sock.authorized = false;
    sock.authorizationError = new Error("CERT_HAS_EXPIRED");
    mockConnect.mockImplementation((_opts, cb: () => void) => {
      queueMicrotask(() => cb());
      return sock;
    });

    const r = await tlsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.authorized).toBe(false);
      expect(r.data.authorizationError).toBe("CERT_HAS_EXPIRED");
    }
  });

  it("returns error on socket error event", async () => {
    const sock = new FakeSocket({ subject: {}, issuer: {}, valid_from: "", valid_to: "" });
    mockConnect.mockImplementation(() => {
      queueMicrotask(() => sock.emit("error", new Error("ECONNREFUSED")));
      return sock;
    });
    const r = await tlsCheck("example.com");
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toMatch(/ECONNREFUSED/);
  });

  it("returns timeout if handshake never completes", async () => {
    const sock = new FakeSocket({ subject: {}, issuer: {}, valid_from: "", valid_to: "" });
    mockConnect.mockImplementation(() => sock);
    const r = await tlsCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  });
});
```

```ts
// lib/dossier/checks/tls.ts
import { connect } from "node:tls";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type TlsCheckData = {
  subject: { CN?: string; O?: string };
  issuer: { CN?: string; O?: string };
  validFrom: string;
  validTo: string;
  sans: string[];
  fingerprint256?: string;
  authorized: boolean;
  authorizationError?: string;
};

const DEFAULT_TIMEOUT_MS = 5_000;

function parseSans(san?: string): string[] {
  if (!san) return [];
  return san
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("DNS:"))
    .map((s) => s.slice(4));
}

export async function tlsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<TlsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise<CheckResult<TlsCheckData>>((resolve) => {
    let done = false;
    const finish = (r: CheckResult<TlsCheckData>) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        /* swallow */
      }
      resolve(r);
    };

    const timer = setTimeout(() => finish({ status: "timeout", ms: timeoutMs }), timeoutMs);

    const socket = connect(
      { host: v.domain, port: 443, servername: v.domain, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          finish({ status: "error", message: "no peer certificate returned" });
          return;
        }
        finish({
          status: "ok",
          data: {
            subject: { CN: cert.subject?.CN, O: cert.subject?.O },
            issuer: { CN: cert.issuer?.CN, O: cert.issuer?.O },
            validFrom: cert.valid_from ?? "",
            validTo: cert.valid_to ?? "",
            sans: parseSans(cert.subjectaltname),
            fingerprint256: cert.fingerprint256,
            authorized: socket.authorized,
            authorizationError: socket.authorizationError?.message,
          },
          fetchedAt: new Date().toISOString(),
        });
      },
    );

    socket.setTimeout(timeoutMs);
    socket.on("error", (err: Error) => finish({ status: "error", message: err.message }));
    socket.on("timeout", () => finish({ status: "timeout", ms: timeoutMs }));
  });
}
```

- [ ] **Step 5: Register** — widen to `... | "tls"`.

- [ ] **Step 6+7: `TlsSection`**

Render subject CN, issuer CN/O, validFrom -> validTo, SAN list, fingerprint, and an authorized badge. If `authorized === false`, render `authorizationError` in danger.

```tsx
// components/dossier/sections/TlsSection.tsx
import { CheckSection } from "@/components/dossier/CheckSection";
import { tlsCheck } from "@/lib/dossier/checks/tls";

export async function TlsSection({ domain }: { domain: string }) {
  const r = await tlsCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection title="tls" toolSlug="dossier-tls" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="tls" toolSlug="dossier-tls" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="tls" toolSlug="dossier-tls" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  const { subject, issuer, validFrom, validTo, sans, fingerprint256, authorized, authorizationError } = r.data;
  return (
    <CheckSection title="tls" toolSlug="dossier-tls" domain={domain} status="ok" fetchedAt={r.fetchedAt}>
      <dl className="space-y-1">
        <div><dt className="text-muted inline">subject cn: </dt><dd className="inline">{subject.CN ?? "—"}</dd></div>
        <div><dt className="text-muted inline">issuer: </dt><dd className="inline">{issuer.CN ?? "—"} / {issuer.O ?? "—"}</dd></div>
        <div><dt className="text-muted inline">valid: </dt><dd className="inline">{validFrom} → {validTo}</dd></div>
        <div><dt className="text-muted inline">authorized: </dt><dd className="inline">{authorized ? "yes" : "no"}</dd></div>
        {!authorized && authorizationError && (
          <div><dt className="text-muted inline">auth error: </dt><dd className="inline text-danger">{authorizationError}</dd></div>
        )}
        {fingerprint256 && (
          <div><dt className="text-muted inline">sha256: </dt><dd className="inline break-all">{fingerprint256}</dd></div>
        )}
        <div>
          <dt className="text-muted">sans</dt>
          <dd>
            <ul className="list-none p-0">
              {sans.length === 0 ? <li className="text-muted">—</li> : sans.map((s) => <li key={s} className="break-all">{s}</li>)}
            </ul>
          </dd>
        </div>
      </dl>
    </CheckSection>
  );
}
```

- [ ] **Step 9: `DossierTls`** — mirror `DossierSpf`.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-tls",
  name: "dossier / tls",
  description: "inspect a domain's TLS certificate: subject, issuer, validity, SANs, fingerprint.",
  category: "network",
  keywords: ["tls", "ssl", "certificate", "dossier", "issuer", "san", "fingerprint"],
  component: DossierTls,
  mcpNames: ["dossier_tls"],
},
```

`content/tool-seo.ts` `"dossier-tls"`: overview covers cert chain basics, Let's Encrypt, SAN matching, `rejectUnauthorized: false` rationale (surface auth errors rather than refusing). Do NOT walk the full chain in v1 — only the peer cert. >=3 howTo, >=2 examples (drwho.me -> Let's Encrypt / Vercel; google.com -> Google Trust Services), >=3 gotchas (cert expiration is a soft signal; SNI required — no SNI = no cert; port 443 only), >=5 faq, >=2 refs (RFC 5280, RFC 6066).

- [ ] **Step 11: MCP**

```ts
import { tlsCheck } from "@/lib/dossier/checks/tls";
// ...
{
  name: "dossier_tls",
  slug: "dossier-tls",
  description: "Fetch the TLS peer certificate for a domain on port 443 and return subject, issuer, validity, SANs, and fingerprint as a CheckResult.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await tlsCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **16**. Append MCP test (mock `node:tls` `connect` at top of test file, same as pure-check test).

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): tls certificate check"
```

---

## Task 6: Redirects check

**Files:** `lib/dossier/checks/redirects.ts`, tests, section, standalone, registry, content, MCP.

Perform `GET https://<domain>/` with `redirect: "manual"` in a loop, following 3xx `Location` responses up to a cap of 10 hops. Record `{url, status}` for each hop. Stop on first non-3xx or on cap.

- [ ] **Step 1+3: `redirectsCheck`**

```ts
// tests/unit/lib/dossier/checks/redirects.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";

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
    global.fetch = vi.fn().mockImplementation(async () => res(301, { location: "https://example.com/loop" })) as unknown as typeof fetch;
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
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await redirectsCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });
});
```

```ts
// lib/dossier/checks/redirects.ts
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type RedirectHop = { url: string; status: number };
export type RedirectsCheckData = { hops: RedirectHop[]; finalStatus: number };

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_HOPS = 10;

export async function redirectsCheck(
  rawDomain: string,
  opts: { timeoutMs?: number; maxHops?: number } = {},
): Promise<CheckResult<RedirectsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxHops = opts.maxHops ?? DEFAULT_MAX_HOPS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const hops: RedirectHop[] = [];
  let url = `https://${v.domain}/`;

  try {
    for (let i = 0; i <= maxHops; i++) {
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)" },
        signal: controller.signal,
      });
      hops.push({ url, status: res.status });
      if (res.status < 300 || res.status >= 400) {
        clearTimeout(timer);
        return { status: "ok", data: { hops, finalStatus: res.status }, fetchedAt: new Date().toISOString() };
      }
      const loc = res.headers.get("location");
      if (!loc) {
        clearTimeout(timer);
        return { status: "error", message: `redirect ${res.status} with no Location header` };
      }
      url = new URL(loc, url).toString();
    }
    clearTimeout(timer);
    return { status: "error", message: `redirect cap exceeded (${maxHops})` };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "redirects"`.

- [ ] **Step 6+7: `RedirectsSection`** — render hops as `<ol>`, each `[status] url`. Show `finalStatus` prominently.

- [ ] **Step 9: `DossierRedirects`** — mirror.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-redirects",
  name: "dossier / redirects",
  description: "trace the HTTP(S) redirect chain from https://<domain>/ up to 10 hops.",
  category: "network",
  keywords: ["redirect", "301", "302", "chain", "dossier", "http"],
  component: DossierRedirects,
  mcpNames: ["dossier_redirects"],
},
```

`content/tool-seo.ts` `"dossier-redirects"`: overview covers 301/302/307/308 semantics, HSTS upgrade not visible here (we start at https://), relative vs absolute `Location`, loop detection via hop cap. >=3 howTo, >=2 examples (apex -> www; path rewrite), >=3 gotchas (we start at https://; first-hop TLS failure surfaces as a network error; cookies/auth may change the chain), >=5 faq, >=2 refs (RFC 9110 §15.4, MDN Redirections).

- [ ] **Step 11: MCP**

```ts
import { redirectsCheck } from "@/lib/dossier/checks/redirects";
// ...
{
  name: "dossier_redirects",
  slug: "dossier-redirects",
  description: "Trace the HTTP redirect chain starting at https://<domain>/, up to 10 hops. Returns the hop list as a CheckResult.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await redirectsCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **17**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): redirects chain check"
```

---

## Task 7: Headers check

**Files:** `lib/dossier/checks/headers.ts`, tests, section, standalone, registry, content, MCP.

Fetch `https://<domain>/` with `redirect: "follow"` and return the final response's headers as a lowercased `Record<string, string>`, plus the final URL. The section highlights security headers.

- [ ] **Step 1+3: `headersCheck`**

```ts
// tests/unit/lib/dossier/checks/headers.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { headersCheck } from "@/lib/dossier/checks/headers";

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
    }
  });

  it("returns error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    expect((await headersCheck("example.com")).status).toBe("error");
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await headersCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });
});
```

```ts
// lib/dossier/checks/headers.ts
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type HeadersCheckData = { finalUrl: string; headers: Record<string, string> };

const DEFAULT_TIMEOUT_MS = 5_000;

export const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

export async function headersCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<HeadersCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${v.domain}/`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return { status: "ok", data: { finalUrl: res.url, headers }, fetchedAt: new Date().toISOString() };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "headers"`.

- [ ] **Step 6+7: `HeadersSection`** — two `<dl>` groups: security headers (from `SECURITY_HEADERS` — show `—` if absent) then other headers.

- [ ] **Step 9: `DossierHeaders`** — mirror.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-headers",
  name: "dossier / headers",
  description: "inspect the response headers served at https://<domain>/ — HSTS, CSP, X-Frame-Options, etc.",
  category: "network",
  keywords: ["headers", "hsts", "csp", "security", "dossier", "http"],
  component: DossierHeaders,
  mcpNames: ["dossier_headers"],
},
```

`content/tool-seo.ts` `"dossier-headers"`: overview covers the six security headers in `SECURITY_HEADERS`, why HSTS `max-age=63072000; preload` matters, CSP tradeoffs. >=3 howTo, >=2 examples (a hardened site vs a plain one), >=3 gotchas (headers can differ per path — we hit `/` only; CDN vs origin; HSTS without `preload` doesn't join the preload list), >=5 faq, >=2 refs (MDN Security Headers; observatory.mozilla.org).

- [ ] **Step 11: MCP**

```ts
import { headersCheck } from "@/lib/dossier/checks/headers";
// ...
{
  name: "dossier_headers",
  slug: "dossier-headers",
  description: "Fetch https://<domain>/ and return the response headers as a CheckResult.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await headersCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **18**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): response headers check"
```

---

## Task 8: CORS check

**Files:** `lib/dossier/checks/cors.ts`, tests, section, standalone, registry, content, MCP.

Send a CORS preflight: `OPTIONS https://<domain>/` with `Origin` and `Access-Control-Request-Method` headers, then report the `access-control-*` response headers. Default `origin = https://drwho.me`, default `method = GET`. Both are MCP-tool inputs.

- [ ] **Step 1+3: `corsCheck`**

```ts
// tests/unit/lib/dossier/checks/cors.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { corsCheck } from "@/lib/dossier/checks/cors";

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
      expect(r.data.preflightStatus).toBe(204);
      expect(r.data.anyAcHeader).toBe(true);
    }
  });

  it("returns ok with anyAcHeader=false when no AC-* headers present", async () => {
    global.fetch = vi.fn().mockResolvedValue(res({ "Content-Type": "text/plain" }, 405)) as unknown as typeof fetch;
    const r = await corsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.anyAcHeader).toBe(false);
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await corsCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });
});
```

```ts
// lib/dossier/checks/cors.ts
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type CorsCheckData = {
  origin: string;
  method: string;
  preflightStatus: number;
  allowOrigin?: string;
  allowMethods?: string;
  allowHeaders?: string;
  allowCredentials?: string;
  maxAge?: string;
  exposeHeaders?: string;
  anyAcHeader: boolean;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_ORIGIN = "https://drwho.me";
const DEFAULT_METHOD = "GET";

export async function corsCheck(
  rawDomain: string,
  opts: { origin?: string; method?: string; timeoutMs?: number } = {},
): Promise<CheckResult<CorsCheckData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const origin = opts.origin ?? DEFAULT_ORIGIN;
  const method = (opts.method ?? DEFAULT_METHOD).toUpperCase();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${v.domain}/`, {
      method: "OPTIONS",
      redirect: "manual",
      headers: {
        "User-Agent": "drwho-dossier/1.0 (+https://drwho.me)",
        Origin: origin,
        "Access-Control-Request-Method": method,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const h = res.headers;
    const allowOrigin = h.get("access-control-allow-origin") ?? undefined;
    const allowMethods = h.get("access-control-allow-methods") ?? undefined;
    const allowHeaders = h.get("access-control-allow-headers") ?? undefined;
    const allowCredentials = h.get("access-control-allow-credentials") ?? undefined;
    const maxAge = h.get("access-control-max-age") ?? undefined;
    const exposeHeaders = h.get("access-control-expose-headers") ?? undefined;
    const anyAcHeader = Boolean(allowOrigin || allowMethods || allowHeaders || allowCredentials || maxAge || exposeHeaders);

    return {
      status: "ok",
      data: {
        origin,
        method,
        preflightStatus: res.status,
        allowOrigin,
        allowMethods,
        allowHeaders,
        allowCredentials,
        maxAge,
        exposeHeaders,
        anyAcHeader,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "cors"`.

- [ ] **Step 6+7: `CorsSection`** — show origin/method, preflight status, and all AC-* headers. If `anyAcHeader === false`, render a muted note: "no access-control-* headers returned — site does not advertise CORS to this origin".

- [ ] **Step 9: `DossierCors`** — mirror.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-cors",
  name: "dossier / cors",
  description: "run a CORS preflight (OPTIONS) against a domain and surface the access-control-* response headers.",
  category: "network",
  keywords: ["cors", "preflight", "options", "dossier", "browser"],
  component: DossierCors,
  mcpNames: ["dossier_cors"],
},
```

`content/tool-seo.ts` `"dossier-cors"`: overview covers preflight mechanics, `*` vs echoed origin, credentials mode. >=3 howTo, >=2 examples (api.github.com; a static site), >=3 gotchas (non-CORS servers still 2xx on OPTIONS; `*` + credentials is invalid; some CDNs require the preflight method to match), >=5 faq, >=2 refs (Fetch Standard §3.2, MDN CORS).

- [ ] **Step 11: MCP**

```ts
import { corsCheck } from "@/lib/dossier/checks/cors";
// ...
{
  name: "dossier_cors",
  slug: "dossier-cors",
  description: "Send a CORS preflight OPTIONS to https://<domain>/ and return the access-control-* headers. Optional `origin` and `method` inputs.",
  inputSchema: {
    domain: z.string().describe("Public FQDN."),
    origin: z.string().optional().describe("Origin header to send; default https://drwho.me"),
    method: z.string().optional().describe("Access-Control-Request-Method; default GET"),
  },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const origin = (input as { origin?: string }).origin;
    const method = (input as { method?: string }).method;
    const r = await corsCheck(domain, { origin, method });
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **19**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): cors preflight check"
```

---

## Task 9: Web-surface check (composite: robots + sitemap + OG + meta)

**Files:** `lib/dossier/checks/web-surface.ts`, tests, section, standalone, registry, content, MCP.

Parallel fetches:
- `GET https://<domain>/robots.txt`
- `GET https://<domain>/sitemap.xml`
- `GET https://<domain>/` — parse `<title>`, `<meta name="description">`, `<meta property="og:*">`, `<meta name="twitter:*">` from the HTML head.

Returns `{ robots: { present: bool, body?: string (<=4KB) }, sitemap: { present: bool, urlCount?: number }, head: { title?, description?, og: {...}, twitter: {...} } }`.

Parsing the head uses regex extraction over the first 64KB of response body — best-effort, not a full parser. Document this in the gotchas.

- [ ] **Step 1+3: `webSurfaceCheck`**

```ts
// tests/unit/lib/dossier/checks/web-surface.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";

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
      if (url.endsWith("/sitemap.xml")) return textRes("<urlset><url><loc>/a</loc></url><url><loc>/b</loc></url></urlset>");
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

  it("returns error if the home page itself fails", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt") || url.endsWith("/sitemap.xml")) return textRes("", 404);
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const r = await webSurfaceCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout", async () => {
    global.fetch = vi.fn(() => new Promise(() => {}) as Promise<Response>) as unknown as typeof fetch;
    expect((await webSurfaceCheck("example.com", { timeoutMs: 25 })).status).toBe("timeout");
  });
});
```

```ts
// lib/dossier/checks/web-surface.ts
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export type WebSurfaceData = {
  robots: { present: boolean; body?: string };
  sitemap: { present: boolean; urlCount?: number };
  head: {
    title?: string;
    description?: string;
    og: Record<string, string>;
    twitter: Record<string, string>;
  };
};

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 64 * 1024;
const ROBOTS_TRUNCATE = 4 * 1024;
const UA = "drwho-dossier/1.0 (+https://drwho.me)";

type TextFetch = { ok: boolean; status: number; body: string };

async function getText(url: string, signal: AbortSignal): Promise<TextFetch> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
    signal,
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

function countSitemapUrls(xml: string): number {
  const m = xml.match(/<loc\b[^>]*>/gi);
  return m ? m.length : 0;
}

function extractTag(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMeta(html: string, attr: "name" | "property", value: string): string | undefined {
  const v = escapeRe(value);
  // Try `attr=... content=...`
  const re1 = new RegExp(`<meta\\s+[^>]*${attr}=["']${v}["'][^>]*content=["']([^"']*)["']`, "i");
  const m1 = html.match(re1);
  if (m1) return m1[1];
  // Try `content=... attr=...` (reversed order)
  const re2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${v}["']`, "i");
  const m2 = html.match(re2);
  return m2 ? m2[1] : undefined;
}

function extractMetaPrefix(html: string, attr: "name" | "property", prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  const pfx = escapeRe(prefix);
  const re = new RegExp(`<meta\\s+[^>]*${attr}=["'](${pfx}[^"']*)["'][^>]*content=["']([^"']*)["']`, "gi");
  // Use matchAll for a side-effect-free iteration that satisfies Biome's no-assign-in-loop.
  for (const m of html.matchAll(re)) {
    out[m[1]] = m[2];
  }
  return out;
}

export async function webSurfaceCheck(
  rawDomain: string,
  opts: { timeoutMs?: number } = {},
): Promise<CheckResult<WebSurfaceData>> {
  const v = validateDomain(rawDomain);
  if (!v.ok) return { status: "error", message: v.reason };

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const base = `https://${v.domain}`;

  try {
    const [robotsR, sitemapR, homeR] = await Promise.all([
      getText(`${base}/robots.txt`, controller.signal).catch(() => null),
      getText(`${base}/sitemap.xml`, controller.signal).catch(() => null),
      getText(`${base}/`, controller.signal),
    ]);
    clearTimeout(timer);

    const head = homeR.body.slice(0, MAX_BODY_BYTES);
    const title = extractTag(head, "title");
    const description = extractMeta(head, "name", "description");
    const og = extractMetaPrefix(head, "property", "og:");
    const twitter = extractMetaPrefix(head, "name", "twitter:");

    const robots = {
      present: robotsR?.ok === true && robotsR.body.length > 0,
      body: robotsR?.ok ? robotsR.body.slice(0, ROBOTS_TRUNCATE) : undefined,
    };
    const sitemap = {
      present: sitemapR?.ok === true && sitemapR.body.length > 0,
      urlCount: sitemapR?.ok ? countSitemapUrls(sitemapR.body) : undefined,
    };

    return {
      status: "ok",
      data: { robots, sitemap, head: { title, description, og, twitter } },
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "timeout", ms: timeoutMs };
    }
    return { status: "error", message: err instanceof Error ? err.message : "unknown error" };
  }
}
```

- [ ] **Step 5: Register** — widen to `... | "web-surface"`.

- [ ] **Step 6+7: `WebSurfaceSection`** — four sub-blocks: robots (present/absent, plus a `<details>` containing the body), sitemap (present + url count), head (title, description), social (OG + Twitter key/value list).

- [ ] **Step 9: `DossierWebSurface`** — mirror.

- [ ] **Step 10: Content**

`content/tools.ts`:

```ts
{
  slug: "dossier-web-surface",
  name: "dossier / web surface",
  description: "fetch robots.txt, sitemap.xml, and the home page's <head> to summarise a domain's public-web surface.",
  category: "network",
  keywords: ["robots", "sitemap", "opengraph", "og", "twitter", "meta", "dossier", "seo"],
  component: DossierWebSurface,
  mcpNames: ["dossier_web_surface"],
},
```

`content/tool-seo.ts` `"dossier-web-surface"`: overview covers robots.txt conventions, sitemap.xml as an indexability signal, OG/Twitter meta as social preview. >=3 howTo, >=2 examples (a content site with full OG vs a landing page), >=3 gotchas (regex head parsing misses some HTML edge cases; sitemap may be behind a sitemap-index; robots is fetched only at `/robots.txt`, not any per-subpath override), >=5 faq, >=2 refs (robotstxt.org, ogp.me).

- [ ] **Step 11: MCP**

```ts
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";
// ...
{
  name: "dossier_web_surface",
  slug: "dossier-web-surface",
  description: "Summarise a domain's public web surface: robots.txt, sitemap.xml, home-page <head> metadata (title, description, OpenGraph, Twitter). Returns a composite CheckResult.",
  inputSchema: { domain: z.string().describe("Public FQDN.") },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await webSurfaceCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

Bump tool count to **20**. Append MCP test.

- [ ] **Step 12: Commit**

```bash
git commit -m "feat(dossier): web-surface composite check (robots + sitemap + head meta)"
```

---

## Task 10: Wire all 9 sections into `/d/[domain]` + update E2E

**Files:**
- Modify: `app/d/[domain]/page.tsx`
- Modify: `tests/e2e/dossier.spec.ts`

- [ ] **Step 1: Rewrite `app/d/[domain]/page.tsx` to mount all 10 sections**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CorsSection } from "@/components/dossier/sections/CorsSection";
import { DkimSection } from "@/components/dossier/sections/DkimSection";
import { DmarcSection } from "@/components/dossier/sections/DmarcSection";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { HeadersSection } from "@/components/dossier/sections/HeadersSection";
import { MxSection } from "@/components/dossier/sections/MxSection";
import { RedirectsSection } from "@/components/dossier/sections/RedirectsSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { SpfSection } from "@/components/dossier/sections/SpfSection";
import { TlsSection } from "@/components/dossier/sections/TlsSection";
import { WebSurfaceSection } from "@/components/dossier/sections/WebSurfaceSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) return { title: "not found" };
  return pageMetadata({
    title: `dossier — ${v.domain}`,
    description: `dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, and web surface for ${v.domain}.`,
    path: `/d/${v.domain}`,
    type: "tool",
  });
}

export default async function DossierPage({
  params,
}: { params: Promise<{ domain: string }> }) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();

  const d = v.domain;
  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <p className="text-sm text-muted">
        an at-a-glance snapshot. each section streams in independently.
      </p>

      <Suspense fallback={<DnsSectionSkeleton domain={d} />}>
        <DnsSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="mx" toolSlug="dossier-mx" domain={d} message="resolving mx…" />}>
        <MxSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="spf" toolSlug="dossier-spf" domain={d} message="resolving spf…" />}>
        <SpfSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="dmarc" toolSlug="dossier-dmarc" domain={d} message="resolving dmarc…" />}>
        <DmarcSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="dkim" toolSlug="dossier-dkim" domain={d} message="probing dkim selectors…" />}>
        <DkimSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="tls" toolSlug="dossier-tls" domain={d} message="fetching tls cert…" />}>
        <TlsSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="redirects" toolSlug="dossier-redirects" domain={d} message="tracing redirects…" />}>
        <RedirectsSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="headers" toolSlug="dossier-headers" domain={d} message="fetching headers…" />}>
        <HeadersSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="cors" toolSlug="dossier-cors" domain={d} message="sending preflight…" />}>
        <CorsSection domain={d} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="web-surface" toolSlug="dossier-web-surface" domain={d} message="inspecting web surface…" />}>
        <WebSurfaceSection domain={d} />
      </Suspense>
    </article>
  );
}
```

- [ ] **Step 2: Rewrite `tests/e2e/dossier.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

const SECTION_IDS = [
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
] as const;

test.describe("domain dossier", () => {
  test("all 10 sections reach a terminal state for example.com", async ({ page }) => {
    await page.goto("/d/example.com");
    for (const id of SECTION_IDS) {
      // Streaming can produce two elements with the same id (fallback + resolved).
      // .last() targets the resolved one.
      await expect(page.locator(`#${id}`).last()).toContainText(
        /\b(ok|error|timeout|not_applicable)\b/,
        { timeout: 20_000 },
      );
    }
  });

  test("invalid domain renders the not-found body", async ({ page }) => {
    // Note: Next.js 15 App Router dynamic streaming routes return HTTP 200 when notFound()
    // fires because headers have already flushed. Assert on body text instead of status.
    await page.goto("/d/not..valid");
    await expect(page.getByText(/not a valid public domain/i)).toBeVisible();
  });

  test("standalone /tools/dossier-dns accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-dns?domain=example.com");
    await expect(page.locator("#dns").last()).toBeVisible({ timeout: 15_000 });
  });

  test("standalone /tools/dossier-mx accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-mx?domain=gmail.com");
    await expect(page.locator("#mx").last()).toContainText(
      /\b(ok|error|timeout|not_applicable)\b/,
      { timeout: 15_000 },
    );
  });
});
```

- [ ] **Step 3: Typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. Every `/tools/dossier-*` slug appears in the build output; `/d/[domain]` is present as dynamic (`ƒ`).

- [ ] **Step 4: Run E2E**

Run: `pnpm test:e2e tests/e2e/dossier.spec.ts`
Expected: PASS. If a single real-network section flakes, raise its timeout; do NOT assert a specific terminal state.

- [ ] **Step 5: Commit**

```bash
git add app/d/[domain]/page.tsx tests/e2e/dossier.spec.ts
git commit -m "feat(dossier): stream all 10 sections on /d/[domain]"
```

---

## Task 11: Final gate

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Unit tests**

Run: `pnpm test`
Expected: all tests pass. Test count bumps by roughly:
- `_doh.test.ts` — 4 tests
- 9 pure-check test files — ~25 tests
- 9 section test files — 36 tests
- 9 additions to `tests/unit/lib/mcp/dossier.test.ts`
- `tests/unit/lib/mcp/tools.test.ts` count bumped 11 -> 20.

- [ ] **Step 4: E2E**

Run: `pnpm test:e2e`
Expected: all prior E2Es plus the expanded `dossier.spec.ts` pass. If CI network flake hits a single section, rerun once before investigating.

- [ ] **Step 5: Build**

Run: `pnpm build`
Expected: PASS. Every `/tools/dossier-*` slug in the build output; `/d/[domain]` dynamic.

- [ ] **Step 6: Manual smoke**

Run: `pnpm dev`

Visit: `http://localhost:3000/d/stripe.com` — 10 sections stream in; spf/dmarc/dkim all ok; tls ok; redirects traced; cors ok with AC-* or muted-note; web-surface with OG tags filled.

Visit: `http://localhost:3000/d/example.com` — sections resolve to a mix of ok and not_applicable (example.com has no DMARC / DKIM / MX).

Visit each `/tools/dossier-<check>?domain=stripe.com` — renders identical section to the flagship view.

- [ ] **Step 7: Commit any final fixes**

If lint/format autofixed anything:

```bash
git add -A
git diff --cached --quiet || git commit -m "chore(dossier): lint + format pass"
```

---

## Acceptance criteria

- `/d/<domain>` streams 10 sections in the order: dns -> mx -> spf -> dmarc -> dkim -> tls -> redirects -> headers -> cors -> web-surface.
- Each check has: pure fn with unit tests (happy / error / not_applicable / timeout + check-specific cases); section component with RTL tests for all four variants; standalone `/tools/dossier-<check>` page; MCP tool returning the CheckResult as JSON.
- `content/tools.ts` lists all 10 dossier slugs; `content/tool-seo.ts` has a matching entry for each meeting the 3/2/3/5/2 floor.
- `lib/mcp/tools.ts` registers 20 tools total (11 pre-Plan-2 + 9 new); `tests/unit/lib/mcp/tools.test.ts` expected count updated.
- `lib/dossier/registry.ts` has all 10 entries; `DossierCheckId` union covers every one.
- E2E spec asserts all 10 sections reach a terminal state on `/d/example.com`.
- Lint, typecheck, unit, e2e, build all pass.
- No new npm dependencies. New runtime surfaces: `node:tls` for TLS; `fetch` with `redirect: "manual"` for redirects.

Plan 3 (rate limiting + caching + `dossier_full` aggregate + Lighthouse) can begin after this ships.
