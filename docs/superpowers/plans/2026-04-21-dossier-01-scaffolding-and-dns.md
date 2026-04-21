# Domain Dossier — Plan 1: Scaffolding + DNS check (vertical slice)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `/d/[domain]` dossier route with its first check (DNS) working end-to-end. Produce a shippable vertical slice — route page, standalone tool page, MCP tool — that establishes the pattern every subsequent check in Plan 2 copies verbatim.

**Architecture:**

- Each check is a pure async function `(domain: string) => CheckResult<T>` in `lib/dossier/checks/*.ts`. Zero React, zero MCP knowledge.
- `CheckResult<T>` is a discriminated union (`ok | timeout | not_applicable | error`). Error handling lives in the type; UI and MCP both pattern-match on `status`.
- `/d/[domain]/page.tsx` is an RSC that validates the domain and mounts one `<Suspense>`-wrapped async section per check. For Plan 1 that is a single `<DnsSection>`.
- Each check also gets its own slug in `content/tools.ts` (e.g. `dossier-dns`) and renders via the existing `/tools/[slug]` route, reusing the shared page shell. The component reads `?domain=<d>` and renders the same `DnsSection`.
- Each check gets one MCP tool (`dossier_dns`) registered in `lib/mcp/tools.ts`, using the same pure function.

**Tech stack:** existing — Next.js 15 App Router + TypeScript strict + Tailwind v4 + Vitest + Playwright + mcp-handler + zod. No new dependencies.

**Reference spec:** `docs/superpowers/specs/2026-04-21-domain-dossier-design.md`

**Out of scope (covered by later plans):**

- Remaining 9 checks (MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface) — Plan 2.
- Upstash Redis rate limiting, denylist, per-check TTL caching, `dossier_full` aggregate MCP tool, Lighthouse polish — Plan 3.

---

## Invariants reaffirmed

- Pure tool logic in `lib/`, UI in `components/`, both web and MCP import the same functions. (CLAUDE.md)
- `content/tools.ts` is the single tool registry. Each dossier check adds one entry. (CLAUDE.md)
- Theme tokens in `app/globals.css` only. No hardcoded colors. (CLAUDE.md)
- Max width 680px, monospace everywhere, no shadows, radius ≤ 4px. (CLAUDE.md)
- Dynamic `params` in Next.js 15 App Router is `Promise<{...}>` — always `await`. (Existing lesson bb6d1154.)
- `typedRoutes: true` validates every `<Link href>` at build. New routes must exist in the same commit as any link to them.
- Biome lints everything. Fixable issues auto-fix on save; rest must pass `pnpm lint`.
- Tests live under `tests/unit/...` mirroring source tree. E2E under `tests/e2e/`.
- Commit messages are single-line conventional commits. No trailers. (Existing cmemory lesson.)

---

## File Structure

**Created:**
- `lib/dossier/types.ts` — `CheckResult<T>` union + `isOk` / `isError` narrowing helpers.
- `lib/dossier/validate-domain.ts` — public-FQDN validator. Rejects IPs, localhost, RFC1918, ports, paths.
- `lib/dossier/checks/dns.ts` — pure fn `dnsCheck(domain)` returning `CheckResult<DnsCheckData>`. Queries A, AAAA, NS, SOA, CAA, TXT in parallel via Cloudflare DoH.
- `lib/dossier/registry.ts` — list of dossier checks `{ id, title, run }` for iteration.
- `components/dossier/CheckSection.tsx` — generic wrapper: title, status badge, `fetchedAt`, standalone-tool link, slot.
- `components/dossier/sections/DnsSection.tsx` — async server component: runs `dnsCheck(domain)`, renders result.
- `components/dossier/sections/DnsSectionSkeleton.tsx` — Suspense fallback for `DnsSection`.
- `components/tools/DossierDns.tsx` — client shim for the standalone `/tools/dossier-dns` page. Reads `?domain=` from URL and renders `<DnsSection>`.
- `app/d/[domain]/page.tsx` — RSC: validates domain, renders shell + `<Suspense>`-wrapped sections.
- `app/d/[domain]/not-found.tsx` — invalid-domain response.
- `app/d/[domain]/loading.tsx` — instant shell while server computes.
- `tests/unit/lib/dossier/types.test.ts`
- `tests/unit/lib/dossier/validate-domain.test.ts`
- `tests/unit/lib/dossier/checks/dns.test.ts`
- `tests/unit/components/dossier/CheckSection.test.tsx`
- `tests/unit/components/dossier/sections/DnsSection.test.tsx`
- `tests/e2e/dossier.spec.ts`

**Modified:**
- `content/tools.ts` — add `dossier-dns` tool entry referencing `DossierDns` component and `mcpNames: ["dossier_dns"]`.
- `lib/mcp/tools.ts` — add `dossier_dns` tool entry with structured input schema.
- `app/sitemap.ts` — exclude `/d/*` dynamic domain pages (only standalone tools stay listed).
- `app/robots.ts` — explicitly allow `/d/*` (indexable but not sitemapped).

---

## Task 1: CheckResult types + narrowing helpers

**Files:**
- Create: `lib/dossier/types.ts`
- Create: `tests/unit/lib/dossier/types.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/lib/dossier/types.test.ts
import { describe, expect, it } from "vitest";
import { type CheckResult, isError, isOk } from "@/lib/dossier/types";

describe("CheckResult narrowing", () => {
  it("isOk narrows to the ok variant and exposes data", () => {
    const r: CheckResult<number> = { status: "ok", data: 42, fetchedAt: "2026-04-21T00:00:00Z" };
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data).toBe(42);
    }
  });

  it("isError returns true for the error variant", () => {
    const r: CheckResult<number> = { status: "error", message: "boom" };
    expect(isError(r)).toBe(true);
  });

  it("isOk returns false for timeout, not_applicable, and error", () => {
    const ts: CheckResult<number>[] = [
      { status: "timeout", ms: 5000 },
      { status: "not_applicable", reason: "no record" },
      { status: "error", message: "boom" },
    ];
    for (const r of ts) expect(isOk(r)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test tests/unit/lib/dossier/types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement types**

```ts
// lib/dossier/types.ts
export type CheckResult<T> =
  | { status: "ok"; data: T; fetchedAt: string }
  | { status: "timeout"; ms: number }
  | { status: "not_applicable"; reason: string }
  | { status: "error"; message: string };

export function isOk<T>(r: CheckResult<T>): r is Extract<CheckResult<T>, { status: "ok" }> {
  return r.status === "ok";
}

export function isError<T>(r: CheckResult<T>): r is Extract<CheckResult<T>, { status: "error" }> {
  return r.status === "error";
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test tests/unit/lib/dossier/types.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/dossier/types.ts tests/unit/lib/dossier/types.test.ts
git commit -m "feat(dossier): CheckResult discriminated union + narrowing helpers"
```

---

## Task 2: Domain validator

**Files:**
- Create: `lib/dossier/validate-domain.ts`
- Create: `tests/unit/lib/dossier/validate-domain.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/lib/dossier/validate-domain.test.ts
import { describe, expect, it } from "vitest";
import { validateDomain } from "@/lib/dossier/validate-domain";

describe("validateDomain", () => {
  it.each([
    ["example.com"],
    ["sub.example.com"],
    ["xn--bcher-kva.de"],
    ["a-b.c-d.example"],
  ])("accepts public FQDN %s", (d) => {
    const r = validateDomain(d);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe(d.toLowerCase());
  });

  it("lowercases mixed-case input", () => {
    const r = validateDomain("Example.COM");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.domain).toBe("example.com");
  });

  it.each([
    ["", "empty"],
    ["localhost", "localhost banned"],
    ["192.168.1.1", "IP banned"],
    ["10.0.0.1", "IP banned"],
    ["::1", "IPv6 banned"],
    ["example.local", ".local banned"],
    ["example.internal", ".internal banned"],
    ["example.test", ".test banned"],
    ["example.com:8080", "port banned"],
    ["example.com/path", "path banned"],
    ["example.com?q=1", "query banned"],
    ["user@example.com", "userinfo banned"],
    ["foo", "single label banned"],
    ["foo..bar", "empty label banned"],
    ["-foo.com", "leading hyphen banned"],
    ["foo-.com", "trailing hyphen banned"],
  ])("rejects %s (%s)", (d) => {
    expect(validateDomain(d).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test tests/unit/lib/dossier/validate-domain.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement validator**

```ts
// lib/dossier/validate-domain.ts
export type ValidateResult = { ok: true; domain: string } | { ok: false; reason: string };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const BANNED_TLDS = new Set(["local", "internal", "test", "example", "localhost"]);
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const HAS_IPV6 = /:/;

export function validateDomain(raw: string): ValidateResult {
  if (typeof raw !== "string") return { ok: false, reason: "not a string" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > 253) return { ok: false, reason: "too long" };

  // Reject anything URL-ish. Disallow ports, paths, queries, userinfo.
  if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("@") || trimmed.includes(":")) {
    if (HAS_IPV6.test(trimmed)) return { ok: false, reason: "ipv6 not allowed" };
    return { ok: false, reason: "must be a bare domain (no scheme, port, path, userinfo)" };
  }

  if (IPV4.test(trimmed)) return { ok: false, reason: "ip addresses not allowed" };

  const domain = trimmed.toLowerCase();
  const labels = domain.split(".");
  if (labels.length < 2) return { ok: false, reason: "must have at least two labels" };
  for (const l of labels) {
    if (l.length === 0) return { ok: false, reason: "empty label" };
    if (!LABEL.test(l)) return { ok: false, reason: `invalid label: ${l}` };
  }

  const tld = labels[labels.length - 1];
  if (BANNED_TLDS.has(tld)) return { ok: false, reason: `banned tld: .${tld}` };
  if (domain === "localhost") return { ok: false, reason: "localhost not allowed" };

  return { ok: true, domain };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test tests/unit/lib/dossier/validate-domain.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add lib/dossier/validate-domain.ts tests/unit/lib/dossier/validate-domain.test.ts
git commit -m "feat(dossier): public-FQDN validator"
```

---

## Task 3: DNS check (pure function)

**Files:**
- Create: `lib/dossier/checks/dns.ts`
- Create: `tests/unit/lib/dossier/checks/dns.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/lib/dossier/checks/dns.test.ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { dnsCheck, DNS_DOSSIER_TYPES } from "@/lib/dossier/checks/dns";

describe("dnsCheck", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns error for invalid domain", async () => {
    const r = await dnsCheck("not a domain");
    expect(r.status).toBe("error");
  });

  it("aggregates answers across record types on success", async () => {
    const fixture = (type: string) =>
      ({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ name: `example.com.`, type: 1, TTL: 60, data: `stub-${type}` }],
        }),
      }) as unknown as Response;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const t = new URL(url).searchParams.get("type") ?? "unknown";
      return fixture(t);
    }) as unknown as typeof fetch;

    const r = await dnsCheck("example.com");
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(Object.keys(r.data.records).sort()).toEqual([...DNS_DOSSIER_TYPES].sort());
      for (const t of DNS_DOSSIER_TYPES) {
        expect(r.data.records[t]).toHaveLength(1);
      }
      expect(r.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("returns not_applicable when domain has zero answers across all types", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    }) as unknown as typeof fetch;
    const r = await dnsCheck("example.com");
    expect(r.status).toBe("not_applicable");
  });

  it("returns error when upstream DoH returns non-200", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response) as unknown as typeof fetch;
    const r = await dnsCheck("example.com");
    expect(r.status).toBe("error");
  });

  it("returns timeout when a fetch hangs past the timeout", async () => {
    global.fetch = vi.fn(
      () => new Promise(() => {}) as Promise<Response>,
    ) as unknown as typeof fetch;
    const r = await dnsCheck("example.com", { timeoutMs: 25 });
    expect(r.status).toBe("timeout");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test tests/unit/lib/dossier/checks/dns.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `dnsCheck`**

```ts
// lib/dossier/checks/dns.ts
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";

export const DNS_DOSSIER_TYPES = ["A", "AAAA", "NS", "SOA", "CAA", "TXT"] as const;
export type DnsDossierType = (typeof DNS_DOSSIER_TYPES)[number];

export type DnsAnswer = { name: string; type: number; TTL: number; data: string };
export type DnsCheckData = {
  records: Record<DnsDossierType, DnsAnswer[]>;
};

type DohResponse = { Status: number; Answer?: DnsAnswer[] };

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
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(v.domain)}&type=${type}`,
        { headers: { Accept: "application/dns-json" }, signal: controller.signal },
      );
      if (!res.ok) throw new Error(`upstream ${res.status} for ${type}`);
      const body = (await res.json()) as DohResponse;
      if (body.Status !== 0) return [type, [] as DnsAnswer[]] as const;
      return [type, body.Answer ?? []] as const;
    });

    const settled = await Promise.all(queries);
    clearTimeout(timer);

    const records = Object.fromEntries(settled) as Record<DnsDossierType, DnsAnswer[]>;
    const totalAnswers = Object.values(records).reduce((a, b) => a + b.length, 0);
    if (totalAnswers === 0) {
      return { status: "not_applicable", reason: "no DNS records found" };
    }
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

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test tests/unit/lib/dossier/checks/dns.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/dossier/checks/dns.ts tests/unit/lib/dossier/checks/dns.test.ts
git commit -m "feat(dossier): DNS check aggregating A/AAAA/NS/SOA/CAA/TXT"
```

---

## Task 4: Check registry

**Files:**
- Create: `lib/dossier/registry.ts`

- [ ] **Step 1: Implement registry**

No test; it's a declarative list consumed by components. Later Plan 2 checks each add one entry here.

```ts
// lib/dossier/registry.ts
import type { CheckResult } from "@/lib/dossier/types";
import { dnsCheck } from "@/lib/dossier/checks/dns";

export type DossierCheckId = "dns";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string; // matches content/tools.ts slug
  run: (domain: string) => Promise<CheckResult<unknown>>;
};

export const dossierChecks: DossierCheck[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", run: dnsCheck },
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dossier/registry.ts
git commit -m "feat(dossier): check registry"
```

---

## Task 5: CheckSection wrapper component

**Files:**
- Create: `components/dossier/CheckSection.tsx`
- Create: `tests/unit/components/dossier/CheckSection.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/components/dossier/CheckSection.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckSection } from "@/components/dossier/CheckSection";

describe("CheckSection", () => {
  it("renders title, status badge, and children", () => {
    render(
      <CheckSection title="dns" toolSlug="dossier-dns" domain="example.com" status="ok" fetchedAt="2026-04-21T00:00:00Z">
        <div>body</div>
      </CheckSection>,
    );
    expect(screen.getByText("dns")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /open standalone/i });
    expect(link).toHaveAttribute("href", "/tools/dossier-dns?domain=example.com");
  });

  it("does not render fetchedAt when missing", () => {
    render(
      <CheckSection title="dns" toolSlug="dossier-dns" domain="example.com" status="timeout">
        <div>body</div>
      </CheckSection>,
    );
    expect(screen.queryByText(/fetched/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test tests/unit/components/dossier/CheckSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement wrapper**

```tsx
// components/dossier/CheckSection.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

type Props = {
  title: string;
  toolSlug: string;
  domain: string;
  status: "ok" | "timeout" | "not_applicable" | "error";
  fetchedAt?: string;
  children: ReactNode;
};

const BADGE_CLASS: Record<Props["status"], string> = {
  ok: "text-accent",
  timeout: "text-muted",
  not_applicable: "text-muted",
  error: "text-danger",
};

export function CheckSection({ title, toolSlug, domain, status, fetchedAt, children }: Props) {
  const href = `/tools/${toolSlug}?domain=${encodeURIComponent(domain)}` as Route;
  return (
    <section id={title} className="space-y-2 border-t pt-4">
      <header className="flex items-baseline justify-between gap-2 text-sm">
        <h2 className="text-sm">
          <span className="text-muted">## </span>
          {title}
          <span className={`ml-2 ${BADGE_CLASS[status]}`}>[{status}]</span>
        </h2>
        <Link href={href} className="text-accent text-xs">
          open standalone →
        </Link>
      </header>
      <div className="text-xs">{children}</div>
      {fetchedAt && <p className="text-xs text-muted">fetched {fetchedAt}</p>}
    </section>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test tests/unit/components/dossier/CheckSection.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add components/dossier/CheckSection.tsx tests/unit/components/dossier/CheckSection.test.tsx
git commit -m "feat(dossier): CheckSection wrapper component"
```

---

## Task 6: DnsSection + skeleton

**Files:**
- Create: `components/dossier/sections/DnsSection.tsx`
- Create: `components/dossier/sections/DnsSectionSkeleton.tsx`
- Create: `tests/unit/components/dossier/sections/DnsSection.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/components/dossier/sections/DnsSection.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DnsSection } from "@/components/dossier/sections/DnsSection";

vi.mock("@/lib/dossier/checks/dns", () => ({
  DNS_DOSSIER_TYPES: ["A", "AAAA", "NS", "SOA", "CAA", "TXT"],
  dnsCheck: vi.fn(),
}));
import { dnsCheck } from "@/lib/dossier/checks/dns";

describe("DnsSection", () => {
  it("renders record rows on ok", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      fetchedAt: "2026-04-21T00:00:00Z",
      data: {
        records: {
          A: [{ name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" }],
          AAAA: [], NS: [], SOA: [], CAA: [], TXT: [],
        },
      },
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/93\.184\.216\.34/)).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders error message on error", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "error",
      message: "boom",
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders no-records line on not_applicable", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "not_applicable",
      reason: "no DNS records found",
    });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/no DNS records found/)).toBeInTheDocument();
  });

  it("renders timeout line", async () => {
    (dnsCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "timeout", ms: 5000 });
    const ui = await DnsSection({ domain: "example.com" });
    render(ui);
    expect(screen.getByText(/timed out after 5000ms/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test tests/unit/components/dossier/sections/DnsSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement DnsSection**

```tsx
// components/dossier/sections/DnsSection.tsx
import { CheckSection } from "@/components/dossier/CheckSection";
import { DNS_DOSSIER_TYPES, dnsCheck } from "@/lib/dossier/checks/dns";

export async function DnsSection({ domain }: { domain: string }) {
  const r = await dnsCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="dns" toolSlug="dossier-dns" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="dns" toolSlug="dossier-dns" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="dns" toolSlug="dossier-dns" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="dns"
      toolSlug="dossier-dns"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <dl className="space-y-2">
        {DNS_DOSSIER_TYPES.map((t) => {
          const rows = r.data.records[t];
          return (
            <div key={t}>
              <dt className="text-muted">{t}</dt>
              <dd>
                {rows.length === 0 ? (
                  <span className="text-muted">—</span>
                ) : (
                  <ul className="list-none p-0">
                    {rows.map((a, i) => (
                      <li key={`${t}-${i}`} className="break-all">
                        <span className="text-muted">ttl={a.TTL} </span>
                        {a.data}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </CheckSection>
  );
}
```

- [ ] **Step 4: Implement skeleton**

```tsx
// components/dossier/sections/DnsSectionSkeleton.tsx
import { CheckSection } from "@/components/dossier/CheckSection";

export function DnsSectionSkeleton({ domain }: { domain: string }) {
  return (
    <CheckSection title="dns" toolSlug="dossier-dns" domain={domain} status="not_applicable">
      <p className="text-muted">resolving…</p>
    </CheckSection>
  );
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `pnpm test tests/unit/components/dossier/sections/DnsSection.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add components/dossier/sections/DnsSection.tsx components/dossier/sections/DnsSectionSkeleton.tsx tests/unit/components/dossier/sections/DnsSection.test.tsx
git commit -m "feat(dossier): DnsSection + skeleton"
```

---

## Task 7: Standalone tool component

**Files:**
- Create: `components/tools/DossierDns.tsx`
- Create: `components/tools/DossierDnsForm.tsx`

The `/tools/[slug]` route takes a `domain?: string` prop from `searchParams` (wired in Task 8). The tool component itself is a server component so `<DnsSection>` (async RSC) renders server-side and streams. The input form is a small client-only island that updates the URL.

- [ ] **Step 1: Implement server wrapper**

```tsx
// components/tools/DossierDns.tsx
import { Suspense } from "react";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { DossierDnsForm } from "@/components/tools/DossierDnsForm";

export function DossierDns({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierDnsForm initial={domain ?? ""} />
      {domain && (
        <Suspense fallback={<DnsSectionSkeleton domain={domain} />}>
          <DnsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement client form**

```tsx
// components/tools/DossierDnsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export function DossierDnsForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [input, setInput] = useState(initial);
  const [, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = input.trim();
        if (!q) return;
        start(() => router.push(`/tools/dossier-dns?domain=${encodeURIComponent(q)}` as Route));
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        name="domain"
        placeholder="example.com"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 bg-bg border px-2 py-1 text-sm"
      />
      <button type="submit" className="border px-3 py-1 text-sm">run</button>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/tools/DossierDns.tsx components/tools/DossierDnsForm.tsx
git commit -m "feat(dossier): standalone dossier-dns tool component"
```

---

## Task 8: Register dossier-dns in content/tools.ts

**Files:**
- Modify: `content/tools.ts`

The existing `Tool` type declares `component: ComponentType` — no props. Widen it so a tool component may optionally accept `{ domain?: string }`. Alternatively keep the type as-is and wrap `DossierDns` in a no-arg component that reads `useSearchParams` on the client. The latter avoids churn but loses SSR of the check.

Choose: widen the type and thread `domain` from the `/tools/[slug]` page. This is a small, localised change.

- [ ] **Step 1: Widen the `Tool` type**

Edit `content/tools.ts`:

```ts
// change
component: ComponentType;
// to
component: ComponentType<{ domain?: string }>;
```

- [ ] **Step 2: Add dossier-dns entry**

```ts
import { DossierDns } from "@/components/tools/DossierDns";
// ...
{
  slug: "dossier-dns",
  name: "dossier / dns",
  description: "resolve A, AAAA, NS, SOA, CAA, and TXT records for a domain in one go.",
  category: "network",
  keywords: ["dns", "dossier", "records", "soa", "caa", "nameserver"],
  component: DossierDns,
  mcpNames: ["dossier_dns"],
},
```

- [ ] **Step 3: Modify `/tools/[slug]` page to pass `domain` prop**

Edit `app/tools/[slug]/page.tsx`:

```ts
// Add searchParams destructuring
export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const domainRaw = sp.domain;
  const domain = typeof domainRaw === "string" ? domainRaw : undefined;
  // ...existing body...
  // change:
  //   <Component />
  // to:
  //   <Component domain={domain} />
}
```

- [ ] **Step 4: Typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. If any existing tool component errors on the new prop, it's a false positive — all existing components already ignore unknown props (React). Verify by eyeballing any reported errors.

- [ ] **Step 5: Commit**

```bash
git add content/tools.ts app/tools/[slug]/page.tsx
git commit -m "feat(dossier): register dossier-dns tool + thread ?domain= through /tools page"
```

---

## Task 9: Dossier route `/d/[domain]`

**Files:**
- Create: `app/d/[domain]/page.tsx`
- Create: `app/d/[domain]/not-found.tsx`
- Create: `app/d/[domain]/loading.tsx`

- [ ] **Step 1: Implement route page**

```tsx
// app/d/[domain]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
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
    description: `dns, tls, email auth, headers, and more for ${v.domain}.`,
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

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${v.domain}`} />
      <TerminalPrompt>dossier for {v.domain}</TerminalPrompt>
      <p className="text-sm text-muted">
        an at-a-glance snapshot. each section streams in independently.
      </p>

      <Suspense fallback={<DnsSectionSkeleton domain={v.domain} />}>
        <DnsSection domain={v.domain} />
      </Suspense>

      {/* Plan 2 will land 9 more <Suspense> sections here */}
    </article>
  );
}
```

- [ ] **Step 2: Implement not-found**

```tsx
// app/d/[domain]/not-found.tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function NotFound() {
  return (
    <article className="space-y-4">
      <Breadcrumb path="~/d/?" />
      <p className="text-sm">
        not a valid public domain. enter a bare FQDN like <code>example.com</code>. no IPs, no ports,
        no paths.
      </p>
    </article>
  );
}
```

- [ ] **Step 3: Implement loading shell**

```tsx
// app/d/[domain]/loading.tsx
export default function Loading() {
  return <p className="text-sm text-muted">building dossier…</p>;
}
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS. The dynamic segment `[domain]` works without `generateStaticParams` — pages are rendered on demand (dynamic SSR). Vercel routes every unknown `/d/*` to this handler.

- [ ] **Step 5: Manual smoke**

Run: `pnpm dev`
Visit: `http://localhost:3000/d/example.com`
Expected: page renders header immediately, DNS section streams in with A/AAAA/NS/SOA/CAA/TXT rows.

Visit: `http://localhost:3000/d/not..valid`
Expected: not-found response (404 status).

- [ ] **Step 6: Commit**

```bash
git add app/d
git commit -m "feat(dossier): /d/[domain] route with streaming DNS section"
```

---

## Task 10: MCP tool `dossier_dns`

**Files:**
- Modify: `lib/mcp/tools.ts`

- [ ] **Step 1: Add the tool**

At the top of the file, add:

```ts
import { dnsCheck, DNS_DOSSIER_TYPES } from "@/lib/dossier/checks/dns";
```

Inside `rawMcpTools`, add:

```ts
{
  name: "dossier_dns",
  slug: "dossier-dns",
  description:
    "Run the DNS section of the domain dossier: resolves A, AAAA, NS, SOA, CAA, TXT in parallel. Returns a CheckResult discriminated union.",
  inputSchema: {
    domain: z.string().describe("Public FQDN, e.g. example.com. IPs, ports, and paths rejected."),
  },
  handler: async (input) => {
    const domain = String((input as { domain?: string }).domain ?? "");
    const r = await dnsCheck(domain);
    return ok(JSON.stringify(r, null, 2));
  },
},
```

(We return the full `CheckResult` — including non-ok variants — as the text payload so agents can inspect `status` directly. No `isError: true` on `not_applicable` / `timeout` / `error` variants; the discriminated union is the contract. This matches the behaviour the spec requires.)

- [ ] **Step 2: Add unit test**

```ts
// tests/unit/lib/mcp/dossier.test.ts
import { describe, expect, it, vi, afterEach } from "vitest";

describe("mcp dossier_dns", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns a CheckResult ok payload for a happy domain", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ name: "example.com.", type: 1, TTL: 60, data: "1.1.1.1" }] }),
    }) as unknown as typeof fetch;
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dns");
    expect(tool).toBeDefined();
    const r = await tool!.handler({ domain: "example.com" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("ok");
  });

  it("returns CheckResult error for invalid domain without isError", async () => {
    const { findMcpTool } = await import("@/lib/mcp/tools");
    const tool = findMcpTool("dossier_dns");
    const r = await tool!.handler({ domain: "not a domain" });
    expect(r.isError).toBeFalsy();
    const parsed = JSON.parse(r.content[0].text);
    expect(parsed.status).toBe("error");
  });
});
```

- [ ] **Step 3: Run tests — expect PASS**

Run: `pnpm test tests/unit/lib/mcp/dossier.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 4: Commit**

```bash
git add lib/mcp/tools.ts tests/unit/lib/mcp/dossier.test.ts
git commit -m "feat(mcp): dossier_dns tool"
```

---

## Task 11: Sitemap + robots updates

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`

Individual dossier tool pages (`/tools/dossier-dns`) are listed in the sitemap automatically because they come from `content/tools.ts`. The dynamic `/d/[domain]` pages are intentionally **not** sitemapped (infinite surface), but must remain indexable.

- [ ] **Step 1: Inspect existing `app/sitemap.ts`**

Read: `app/sitemap.ts`
Confirm: no change needed — sitemap iterates static routes + `content/tools.ts`. Dynamic `/d/*` is neither; it's excluded by omission.

- [ ] **Step 2: Check robots allows `/d/*`**

Read: `app/robots.ts`
Confirm: robots.ts does not disallow `/d/` (or explicitly allows `/`). If there is no disallow for `/d`, no change needed.

If there IS a disallow that accidentally catches `/d`, add an allow rule:

```ts
allow: ["/d/"],
```

- [ ] **Step 3: If edits were needed, commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat(dossier): keep /d/[domain] indexable, not sitemapped"
```

If no edits were needed, skip.

---

## Task 12: E2E smoke test

**Files:**
- Create: `tests/e2e/dossier.spec.ts`

- [ ] **Step 1: Write test**

```ts
// tests/e2e/dossier.spec.ts
import { expect, test } from "@playwright/test";

test.describe("domain dossier", () => {
  test("renders DNS section for example.com", async ({ page }) => {
    await page.goto("/d/example.com");
    await expect(page.getByRole("heading", { name: /dns/i })).toBeVisible({ timeout: 15_000 });
    // Terminal state: ok / error / not_applicable / timeout — any is acceptable for a real network call.
    await expect(page.locator("#dns")).toContainText(/\b(ok|error|timeout|not_applicable)\b/);
  });

  test("invalid domain returns not-found body", async ({ page }) => {
    const resp = await page.goto("/d/not..valid");
    expect(resp?.status()).toBe(404);
    await expect(page.getByText(/not a valid public domain/i)).toBeVisible();
  });

  test("standalone /tools/dossier-dns accepts ?domain=", async ({ page }) => {
    await page.goto("/tools/dossier-dns?domain=example.com");
    await expect(page.locator("#dns")).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: Run E2E**

Run: `pnpm test:e2e tests/e2e/dossier.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/dossier.spec.ts
git commit -m "test(dossier): e2e smoke for /d/[domain] and standalone tool"
```

---

## Task 13: Final gate — lint, typecheck, unit, e2e

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: PASS. If Biome flags formatting, run `pnpm format` and inspect diff.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Unit tests**

Run: `pnpm test`
Expected: all tests pass, including the existing 100.

- [ ] **Step 4: E2E tests**

Run: `pnpm test:e2e`
Expected: all prior E2Es plus the new dossier spec pass.

- [ ] **Step 5: If any step fails, fix root cause and re-run. Do not advance with red.**

- [ ] **Step 6: Final commit if any lint/format touched files**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore(dossier): lint + format pass"
```

---

## Acceptance criteria

- `/d/example.com` renders a shell immediately and streams in a DNS section showing A / AAAA / NS / SOA / CAA / TXT records (or the appropriate `error` / `not_applicable` / `timeout` badge).
- `/d/not..valid` returns a 404 with a helpful message.
- `/tools/dossier-dns?domain=example.com` renders the same DNS section in a standalone page.
- MCP tool `dossier_dns(domain)` returns a JSON-serialised `CheckResult<DnsCheckData>`.
- All prior tests still pass. Lint, typecheck clean.
- No new env vars, no new infra dependencies.

Plan 2 can begin after this ships. Every subsequent check in Plan 2 is a copy of Tasks 3 (pure check) + 6 (section) + 8 (register) + 10 (MCP tool).
