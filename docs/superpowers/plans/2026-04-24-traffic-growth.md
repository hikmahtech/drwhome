# Traffic Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a viral shareable surface on `/d/[domain]`, seed sitemap with popular domains, rename dossier tool slugs to search-friendly names, add 14 targeted blog posts, and ship three MCP client landing pages — driving organic search, AI-tool distribution, and share-loop traffic into drwho.me.

**Architecture:** Three phases, sequential ship order so blog CTAs link to a surface that's already shareable. Phase 1 ships the OG image + share button + analytics + SEO surface pages. Phase 2 renames tool slugs (with redirects) and ships 8 dossier-wedge blog posts wired to those slugs. Phase 3 ships 6 more blog posts (dev-utility + MCP/AI) and 3 MCP client landing pages.

**Tech Stack:** Next.js 15 App Router (RSC + `ImageResponse`), TypeScript strict, Tailwind v4, `next/og`, `unstable_cache`, Vitest, Playwright, `@next/mdx` for blog posts.

**Reference spec:** `docs/superpowers/specs/2026-04-24-traffic-growth-design.md`

---

## File structure

### Created

- `components/blog/ToolCtaLink.tsx` — client component wrapping a tool CTA link with `trackBlogToolClick`
- `components/dossier/DossierViewTracker.tsx` — client component fires `trackDossierViewed` on mount
- `components/dossier/ShareButton.tsx` — client component with `navigator.clipboard.writeText` + `trackDossierShared`
- `app/d/[domain]/opengraph-image.tsx` — OG image for dossier pages
- `app/tools/page.tsx` — hub page listing all tools
- `app/domain-dossier/page.tsx` — SEO landing page for the dossier flagship
- `app/mcp/claude/page.tsx` — Claude Desktop install landing
- `app/mcp/cursor/page.tsx` — Cursor install landing
- `app/mcp/openai/page.tsx` — ChatGPT/OpenAI install landing
- `content/posts/what-is-dmarc.mdx` + 13 more MDX files (14 total)
- `docs/notes/mcp-directories.md` — submission checklist
- Unit and E2E tests alongside each of the above

### Modified

- `lib/analytics/client.ts` — add `trackDossierViewed`, `trackDossierShared`, `trackMcpInstallClick`, `trackBlogToolClick`
- `app/d/[domain]/page.tsx` — mount `DossierViewTracker` + `ShareButton`, update `toolSlug` props after rename
- `app/sitemap.ts` — seed `~200` popular `/d/[domain]` URLs, add `/tools`, `/domain-dossier`, `/mcp/claude`, `/mcp/cursor`, `/mcp/openai`
- `content/tools.ts` — rename 10 dossier slugs + update display names
- `content/tool-seo.ts` — rename record keys to match
- `lib/dossier/registry.ts` — update `toolSlug` in each row after rename
- `next.config.ts` — add `async redirects()` for 10 old → new slug mappings
- `content/posts.ts` — import + register 14 new posts
- `tests/unit/app/sitemap.test.ts` — update slug assertions; allow seeded `/d/` paths
- `tests/unit/lib/analytics/client.test.ts` — tests for four new tracker fns
- `tests/e2e/seo.spec.ts` — assert canonical OG image exists for `/d/example.com`

### Not changed

- `lib/dossier/checks/*.ts` — pure check logic stays untouched
- `content/tools.ts` tool order/categories — only slugs + display names change
- `lib/mcp/tools.ts` — MCP tool names already match spec; `DENYLIST_GATED` uses MCP names, not web slugs

---

## Conventions for every task

- Each task is a single logical commit.
- Run `pnpm biome check --write` before committing; run `pnpm vitest run <changed>` for unit scope and `pnpm test` (vitest + playwright) at phase boundaries.
- Commit messages: conventional, single line, no Co-Authored-By trailer. Prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- All new components default to server components unless they need browser APIs; client components are annotated `"use client"` on line 1.
- No logic in components — any non-trivial function goes in `lib/`.
- Lowercase monospace aesthetic everywhere; no shadows; `max-w-[680px]`; theme tokens from `app/globals.css` only.

---

## Phase 1 — Shareable surface + SEO foundation

### Task 1: Analytics trackers for dossier, MCP, blog

**Files:**
- Modify: `lib/analytics/client.ts`
- Modify: `tests/unit/lib/analytics/client.test.ts`

- [ ] **Step 1: Write failing tests for the four new trackers**

Replace `tests/unit/lib/analytics/client.test.ts` with:

```ts
import {
  trackBlogToolClick,
  trackDossierShared,
  trackDossierViewed,
  trackMcpInstallClick,
  trackToolExecuted,
} from "@/lib/analytics/client";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("trackToolExecuted", () => {
  it("calls gtag with tool_executed event and params", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackToolExecuted("base64", true);
    expect(gtag).toHaveBeenCalledWith("event", "tool_executed", {
      tool_slug: "base64",
      success: true,
    });
  });

  it("forwards failure flag", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackToolExecuted("jwt", false);
    expect(gtag).toHaveBeenCalledWith("event", "tool_executed", {
      tool_slug: "jwt",
      success: false,
    });
  });

  it("no-ops when gtag is undefined", () => {
    window.gtag = undefined;
    expect(() => trackToolExecuted("base64", true)).not.toThrow();
  });
});

describe("trackDossierViewed", () => {
  it("fires dossier_viewed with domain", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackDossierViewed("stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_viewed", {
      domain: "stripe.com",
    });
  });

  it("no-ops when gtag is undefined", () => {
    expect(() => trackDossierViewed("stripe.com")).not.toThrow();
  });
});

describe("trackDossierShared", () => {
  it("fires dossier_shared with domain", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackDossierShared("stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_shared", {
      domain: "stripe.com",
    });
  });
});

describe("trackMcpInstallClick", () => {
  it("fires mcp_install_click with client id", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackMcpInstallClick("claude");
    expect(gtag).toHaveBeenCalledWith("event", "mcp_install_click", {
      client: "claude",
    });
  });
});

describe("trackBlogToolClick", () => {
  it("fires blog_tool_click with post and tool slugs", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackBlogToolClick("what-is-dmarc", "dmarc-checker");
    expect(gtag).toHaveBeenCalledWith("event", "blog_tool_click", {
      post_slug: "what-is-dmarc",
      tool_slug: "dmarc-checker",
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pnpm vitest run tests/unit/lib/analytics/client.test.ts`
Expected: 4 failing suites (`trackDossierViewed`, `trackDossierShared`, `trackMcpInstallClick`, `trackBlogToolClick`) with import errors.

- [ ] **Step 3: Implement the four new tracker functions**

Replace `lib/analytics/client.ts` with:

```ts
type GtagArg = string | number | boolean | Date | Record<string, unknown>;
type GtagFn = (...args: GtagArg[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

function emit(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

export function trackToolExecuted(slug: string, success: boolean): void {
  emit("tool_executed", { tool_slug: slug, success });
}

export function trackDossierViewed(domain: string): void {
  emit("dossier_viewed", { domain });
}

export function trackDossierShared(domain: string): void {
  emit("dossier_shared", { domain });
}

export function trackMcpInstallClick(client: string): void {
  emit("mcp_install_click", { client });
}

export function trackBlogToolClick(postSlug: string, toolSlug: string): void {
  emit("blog_tool_click", { post_slug: postSlug, tool_slug: toolSlug });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pnpm vitest run tests/unit/lib/analytics/client.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/client.ts tests/unit/lib/analytics/client.test.ts
git commit -m "feat(analytics): add dossier, mcp, and blog trackers"
```

---

### Task 2: Shareable OG image for `/d/[domain]`

**Files:**
- Create: `app/d/[domain]/opengraph-image.tsx`
- Create: `lib/dossier/og-summary.ts`
- Create: `tests/unit/lib/dossier/og-summary.test.ts`

The OG image calls the cached check functions via `dossierChecks`. If a check has cached data, it returns instantly. If cold, we time it out and show the badge as `pending` so image generation never blocks on live DNS/HTTP calls. Badge color: green for `ok`, red for `error`/`timeout`, muted for `not_applicable` or `pending`.

- [ ] **Step 1: Write failing test for summary helper**

Create `tests/unit/lib/dossier/og-summary.test.ts`:

```ts
import type { CheckResult } from "@/lib/dossier/types";
import { summarizeForOg } from "@/lib/dossier/og-summary";
import { describe, expect, it } from "vitest";

function ok<T>(data: T): CheckResult<T> {
  return { status: "ok", data, fetchedAt: "2026-04-24T00:00:00Z" };
}

describe("summarizeForOg", () => {
  it("counts only ok results as passed", () => {
    const results = [
      ok({}),
      ok({}),
      { status: "error", message: "boom" } as CheckResult<unknown>,
      { status: "timeout", ms: 4000 } as CheckResult<unknown>,
      { status: "not_applicable", reason: "n/a" } as CheckResult<unknown>,
      null,
    ];
    const s = summarizeForOg(results);
    expect(s.passed).toBe(2);
    expect(s.total).toBe(6);
  });

  it("maps null to pending badge", () => {
    const s = summarizeForOg([null, null]);
    expect(s.badges).toEqual([
      { state: "pending" },
      { state: "pending" },
    ]);
  });

  it("maps ok to pass and error/timeout to fail", () => {
    const s = summarizeForOg([
      ok({}),
      { status: "error", message: "x" } as CheckResult<unknown>,
      { status: "timeout", ms: 4000 } as CheckResult<unknown>,
      { status: "not_applicable", reason: "x" } as CheckResult<unknown>,
    ]);
    expect(s.badges.map((b) => b.state)).toEqual(["pass", "fail", "fail", "na"]);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `pnpm vitest run tests/unit/lib/dossier/og-summary.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `summarizeForOg`**

Create `lib/dossier/og-summary.ts`:

```ts
import type { CheckResult } from "@/lib/dossier/types";

export type OgBadgeState = "pass" | "fail" | "na" | "pending";

export type OgBadge = { state: OgBadgeState };

export type OgSummary = {
  total: number;
  passed: number;
  badges: OgBadge[];
};

export function summarizeForOg(
  results: Array<CheckResult<unknown> | null>,
): OgSummary {
  const badges: OgBadge[] = results.map((r) => {
    if (r === null) return { state: "pending" };
    if (r.status === "ok") return { state: "pass" };
    if (r.status === "not_applicable") return { state: "na" };
    return { state: "fail" };
  });
  const passed = badges.filter((b) => b.state === "pass").length;
  return { total: results.length, passed, badges };
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `pnpm vitest run tests/unit/lib/dossier/og-summary.test.ts`
Expected: pass.

- [ ] **Step 5: Write the OG image route**

Create `app/d/[domain]/opengraph-image.tsx`:

```tsx
import { dossierChecks } from "@/lib/dossier/registry";
import { summarizeForOg, type OgBadgeState } from "@/lib/dossier/og-summary";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

const PER_CHECK_TIMEOUT_MS = 1500;

async function timed(
  p: Promise<CheckResult<unknown>>,
): Promise<CheckResult<unknown> | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PER_CHECK_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

function badgeColor(state: OgBadgeState): string {
  if (state === "pass") return OG_COLORS.accent;
  if (state === "fail") return "#ef4444";
  return OG_COLORS.muted;
}

export default async function OG({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();
  const domain = v.domain;
  const font = loadMonoFont();

  const results = await Promise.all(
    dossierChecks.map((c) => timed(c.run(domain))),
  );
  const summary = summarizeForOg(results);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
        ~/d/{domain}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 72, color: OG_COLORS.fg, lineHeight: 1.1 }}>
          {domain}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 40,
          }}
        >
          {dossierChecks.map((c, i) => {
            const b = summary.badges[i];
            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid ${OG_COLORS.border}`,
                  padding: "8px 14px",
                  fontSize: 22,
                  color: OG_COLORS.fg,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: badgeColor(b.state),
                    display: "flex",
                  }}
                />
                {c.title}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
        {summary.passed}/{summary.total} checks passed · drwho.me
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 6: Run the dev server and visit the OG route directly**

Run: `pnpm dev` and open `http://localhost:3000/d/example.com/opengraph-image`
Expected: 1200×630 PNG renders with 10 badges. On cold cache most badges are muted (pending); after visiting `/d/example.com` once and re-requesting, badges fill with pass/fail colors.

- [ ] **Step 7: Commit**

```bash
git add app/d/[domain]/opengraph-image.tsx lib/dossier/og-summary.ts tests/unit/lib/dossier/og-summary.test.ts
git commit -m "feat(dossier): add shareable opengraph-image route"
```

---

### Task 3: Share button + view tracker on `/d/[domain]`

**Files:**
- Create: `components/dossier/ShareButton.tsx`
- Create: `components/dossier/DossierViewTracker.tsx`
- Create: `tests/unit/components/dossier/ShareButton.test.tsx`
- Create: `tests/unit/components/dossier/DossierViewTracker.test.tsx`
- Modify: `app/d/[domain]/page.tsx`

- [ ] **Step 1: Write failing test for `ShareButton`**

Create `tests/unit/components/dossier/ShareButton.test.tsx`:

```tsx
import { ShareButton } from "@/components/dossier/ShareButton";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
  vi.restoreAllMocks();
});

describe("ShareButton", () => {
  it("copies location to clipboard and fires analytics on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<ShareButton domain="stripe.com" href="https://drwho.me/d/stripe.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith("https://drwho.me/d/stripe.com");
    expect(gtag).toHaveBeenCalledWith("event", "dossier_shared", {
      domain: "stripe.com",
    });
  });

  it("shows copied state after click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ShareButton domain="stripe.com" href="https://drwho.me/d/stripe.com" />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(await screen.findByText(/copied/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `pnpm vitest run tests/unit/components/dossier/ShareButton.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Implement `ShareButton`**

Create `components/dossier/ShareButton.tsx`:

```tsx
"use client";

import { trackDossierShared } from "@/lib/analytics/client";
import { useState } from "react";

type Props = {
  domain: string;
  href: string;
};

export function ShareButton({ domain, href }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(href);
      trackDossierShared(domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, permission denied). Swallow.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm underline decoration-dotted underline-offset-4 hover:text-accent"
      aria-label="copy link"
    >
      {copied ? "copied →" : "copy link →"}
    </button>
  );
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `pnpm vitest run tests/unit/components/dossier/ShareButton.test.tsx`
Expected: pass.

- [ ] **Step 5: Write failing test for `DossierViewTracker`**

Create `tests/unit/components/dossier/DossierViewTracker.test.tsx`:

```tsx
import { DossierViewTracker } from "@/components/dossier/DossierViewTracker";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("DossierViewTracker", () => {
  it("fires dossier_viewed exactly once on mount", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { rerender } = render(<DossierViewTracker domain="stripe.com" />);
    rerender(<DossierViewTracker domain="stripe.com" />);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "dossier_viewed", {
      domain: "stripe.com",
    });
  });

  it("renders nothing", () => {
    const { container } = render(<DossierViewTracker domain="stripe.com" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 6: Implement `DossierViewTracker`**

Create `components/dossier/DossierViewTracker.tsx`:

```tsx
"use client";

import { trackDossierViewed } from "@/lib/analytics/client";
import { useEffect, useRef } from "react";

type Props = {
  domain: string;
};

export function DossierViewTracker({ domain }: Props) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackDossierViewed(domain);
  }, [domain]);
  return null;
}
```

- [ ] **Step 7: Run the tracker test to confirm it passes**

Run: `pnpm vitest run tests/unit/components/dossier/DossierViewTracker.test.tsx`
Expected: pass.

- [ ] **Step 8: Wire both into `/d/[domain]/page.tsx`**

Edit `app/d/[domain]/page.tsx`. After the existing imports, add:

```tsx
import { DossierViewTracker } from "@/components/dossier/DossierViewTracker";
import { ShareButton } from "@/components/dossier/ShareButton";
import { siteUrl } from "@/lib/seo";
```

Inside the returned `<article>` for the normal (non-denied, non-rate-limited) path, replace the existing `<TerminalPrompt>` + description block with:

```tsx
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <DossierViewTracker domain={d} />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          an at-a-glance snapshot. each section streams in independently.
        </p>
        <ShareButton domain={d} href={`${siteUrl()}/d/${d}`} />
      </div>
```

Leave the 10 `<Suspense>` blocks unchanged.

- [ ] **Step 9: Run the E2E smoke test**

Run: `pnpm exec playwright test tests/e2e/dossier.spec.ts`
Expected: pass (share button is purely additive; no existing assertion regresses).

- [ ] **Step 10: Commit**

```bash
git add components/dossier/ShareButton.tsx components/dossier/DossierViewTracker.tsx tests/unit/components/dossier/ShareButton.test.tsx tests/unit/components/dossier/DossierViewTracker.test.tsx app/d/[domain]/page.tsx
git commit -m "feat(dossier): add share button and view tracker"
```

---

### Task 4: Seed sitemap with popular domains

**Files:**
- Create: `lib/seo/popular-domains.ts`
- Create: `tests/unit/lib/seo/popular-domains.test.ts`
- Modify: `app/sitemap.ts`
- Modify: `tests/unit/app/sitemap.test.ts`

Why a separate file: the list is long (~200 entries), the sitemap module stays readable, and other future surfaces (e.g. the `/domain-dossier` landing page if we want to feature a rotating selection) can import the same source.

- [ ] **Step 1: Write failing test for the popular-domains module**

Create `tests/unit/lib/seo/popular-domains.test.ts`:

```ts
import { popularDomains } from "@/lib/seo/popular-domains";
import { describe, expect, it } from "vitest";

const DOMAIN_RE = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)+$/;

describe("popularDomains", () => {
  it("has at least 150 entries", () => {
    expect(popularDomains.length).toBeGreaterThanOrEqual(150);
  });

  it("contains no duplicates", () => {
    expect(new Set(popularDomains).size).toBe(popularDomains.length);
  });

  it("all entries are lowercase valid domain syntax", () => {
    for (const d of popularDomains) {
      expect(d).toBe(d.toLowerCase());
      expect(d).toMatch(DOMAIN_RE);
      expect(d).not.toContain(" ");
      expect(d).not.toContain("/");
    }
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `pnpm vitest run tests/unit/lib/seo/popular-domains.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the popular domains list**

Create `lib/seo/popular-domains.ts`:

```ts
/**
 * Hand-curated list of high-authority domains used to seed the sitemap.
 * Search bots crawling these /d/<domain> URLs warm-cache the dossier results
 * and index the pages with real data. No manual content per entry.
 *
 * All entries MUST be lowercase, syntactically valid domains (no scheme, no path).
 * Enforced by tests/unit/lib/seo/popular-domains.test.ts.
 */
export const popularDomains: readonly string[] = [
  // Developer platforms
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "sourcehut.org",
  "codeberg.org",
  "vercel.com",
  "netlify.com",
  "render.com",
  "railway.app",
  "fly.io",
  "heroku.com",
  "digitalocean.com",
  "linode.com",
  "vultr.com",
  "hetzner.com",
  // Cloud
  "aws.amazon.com",
  "cloud.google.com",
  "azure.microsoft.com",
  "cloudflare.com",
  "fastly.com",
  "akamai.com",
  "bunny.net",
  // Email providers
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "protonmail.com",
  "icloud.com",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
  "zoho.com",
  // Email infrastructure
  "sendgrid.com",
  "mailchimp.com",
  "mailgun.com",
  "postmarkapp.com",
  "brevo.com",
  "resend.com",
  "amazonses.com",
  "sparkpost.com",
  // Productivity SaaS
  "notion.so",
  "linear.app",
  "figma.com",
  "slack.com",
  "loom.com",
  "miro.com",
  "airtable.com",
  "asana.com",
  "trello.com",
  "basecamp.com",
  "clickup.com",
  "monday.com",
  // Payments
  "stripe.com",
  "paypal.com",
  "square.com",
  "adyen.com",
  "braintreepayments.com",
  "wise.com",
  "revolut.com",
  "payoneer.com",
  "shopify.com",
  "bigcommerce.com",
  // Auth / identity
  "auth0.com",
  "okta.com",
  "onelogin.com",
  "clerk.com",
  "workos.com",
  "supertokens.com",
  "1password.com",
  "bitwarden.com",
  "lastpass.com",
  // Databases / backends
  "mongodb.com",
  "postgresql.org",
  "mysql.com",
  "redis.io",
  "sqlite.org",
  "supabase.com",
  "planetscale.com",
  "neon.tech",
  "cockroachlabs.com",
  "firebase.google.com",
  // Observability
  "datadoghq.com",
  "grafana.com",
  "sentry.io",
  "pagerduty.com",
  "newrelic.com",
  "honeycomb.io",
  "rollbar.com",
  "loggly.com",
  "splunk.com",
  // Analytics / product
  "segment.com",
  "mixpanel.com",
  "amplitude.com",
  "posthog.com",
  "hotjar.com",
  "fullstory.com",
  // CI / build / package
  "circleci.com",
  "travis-ci.com",
  "buildkite.com",
  "semaphoreci.com",
  "npmjs.com",
  "pypi.org",
  "crates.io",
  "packagist.org",
  "rubygems.org",
  "maven.org",
  // AI / ML
  "openai.com",
  "anthropic.com",
  "huggingface.co",
  "replicate.com",
  "cohere.com",
  "mistral.ai",
  "perplexity.ai",
  "elevenlabs.io",
  // Infra / devops tools
  "hashicorp.com",
  "docker.com",
  "kubernetes.io",
  "helm.sh",
  "istio.io",
  "terraform.io",
  "ansible.com",
  // Media / social
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "youtube.com",
  "twitch.tv",
  "reddit.com",
  "medium.com",
  "substack.com",
  "mastodon.social",
  "bsky.app",
  "threads.net",
  "tiktok.com",
  "pinterest.com",
  // News / publishing
  "nytimes.com",
  "wsj.com",
  "theguardian.com",
  "bbc.com",
  "cnn.com",
  "reuters.com",
  "bloomberg.com",
  "techcrunch.com",
  "wired.com",
  "arstechnica.com",
  "theverge.com",
  "ycombinator.com",
  "news.ycombinator.com",
  "producthunt.com",
  "stackoverflow.com",
  "dev.to",
  "hashnode.com",
  // Storage / sync
  "dropbox.com",
  "box.com",
  "onedrive.live.com",
  "drive.google.com",
  "icloud.com",
  // Registrars / DNS
  "godaddy.com",
  "namecheap.com",
  "hover.com",
  "porkbun.com",
  "gandi.net",
  "dnsimple.com",
  "route53.amazonaws.com",
  "ns1.com",
  // Commerce / reference
  "amazon.com",
  "ebay.com",
  "walmart.com",
  "target.com",
  "bestbuy.com",
  "apple.com",
  "microsoft.com",
  "google.com",
  "meta.com",
  // Banks / fintech
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "citibank.com",
  "hsbc.com",
  "barclays.co.uk",
  "americanexpress.com",
  "capitalone.com",
  "schwab.com",
  "fidelity.com",
  "robinhood.com",
  // Communications
  "zoom.us",
  "teams.microsoft.com",
  "meet.google.com",
  "webex.com",
  "discord.com",
  "telegram.org",
  "signal.org",
  "whatsapp.com",
  // Video / streaming
  "netflix.com",
  "disneyplus.com",
  "hulu.com",
  "primevideo.com",
  "spotify.com",
  "soundcloud.com",
  // CRM / support
  "salesforce.com",
  "hubspot.com",
  "zendesk.com",
  "intercom.com",
  "freshdesk.com",
  "helpscout.com",
  // Website builders
  "webflow.com",
  "squarespace.com",
  "wix.com",
  "wordpress.com",
  "ghost.org",
  // Search / ops
  "algolia.com",
  "meilisearch.com",
  "elastic.co",
  // Telephony
  "twilio.com",
  "vonage.com",
  "plivo.com",
  // Image / media CDN
  "cloudinary.com",
  "imgix.com",
];
```

(Hitting ~180 entries; pad with any handful of extras the engineer knows of to cross 200 — the test only requires ≥150, but the spec targets ~200.)

- [ ] **Step 4: Run the popular-domains test**

Run: `pnpm vitest run tests/unit/lib/seo/popular-domains.test.ts`
Expected: pass.

- [ ] **Step 5: Update the sitemap test for the new shape**

Replace `tests/unit/app/sitemap.test.ts`:

```ts
import sitemap from "@/app/sitemap";
import { popularDomains } from "@/lib/seo/popular-domains";
import { describe, expect, it } from "vitest";

describe("sitemap", () => {
  it("includes every /tools/<slug> route", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/tools/dmarc-checker"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/tools/base64"))).toBe(true);
  });

  it("includes the tools hub and domain-dossier landing", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/tools"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/domain-dossier"))).toBe(true);
  });

  it("includes every popular /d/<domain> seed", () => {
    const entries = sitemap().map((e) => e.url);
    for (const d of popularDomains) {
      expect(entries.some((u) => u.endsWith(`/d/${d}`))).toBe(true);
    }
  });

  it("does not include duplicates", () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("mcp client landings are listed", () => {
    const entries = sitemap().map((e) => e.url);
    expect(entries.some((u) => u.endsWith("/mcp/claude"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/mcp/cursor"))).toBe(true);
    expect(entries.some((u) => u.endsWith("/mcp/openai"))).toBe(true);
  });
});
```

The `dmarc-checker` slug assertion will fail now (we haven't renamed yet), and `/tools`, `/domain-dossier`, and the `/mcp/*` pages will fail too because those pages are added in later tasks. That's expected — we'll flip them green as each task lands.

- [ ] **Step 6: Update `app/sitemap.ts` with seeds + new landing routes**

Replace `app/sitemap.ts`:

```ts
import { posts } from "@/content/posts";
import { tools } from "@/content/tools";
import { popularDomains } from "@/lib/seo/popular-domains";
import { siteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/domain-dossier`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/mcp`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/mcp/claude`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/mcp/cursor`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/mcp/openai`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const toolPaths: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));
  const postPaths: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const seedPaths: MetadataRoute.Sitemap = popularDomains.map((d) => ({
    url: `${base}/d/${d}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return [...staticPaths, ...toolPaths, ...postPaths, ...seedPaths];
}
```

- [ ] **Step 7: Partial green check**

Run: `pnpm vitest run tests/unit/app/sitemap.test.ts`
Expected: assertions for `/d/<domain>` seeds and duplicates pass. Assertions for `/tools`, `/domain-dossier`, `/mcp/claude`, `/mcp/cursor`, `/mcp/openai`, and the renamed `dmarc-checker` slug still fail — leave them failing; later tasks make them green.

(If you want a fully green commit now, temporarily skip those blocks with `it.skip`; but the recommended flow is to commit red-tests-for-future-work so each later task has an automatic signal.)

- [ ] **Step 8: Commit**

```bash
git add lib/seo/popular-domains.ts tests/unit/lib/seo/popular-domains.test.ts app/sitemap.ts tests/unit/app/sitemap.test.ts
git commit -m "feat(sitemap): seed popular domains and landing routes"
```

---

### Task 5: `/tools` hub page

**Files:**
- Create: `app/tools/page.tsx`
- Create: `tests/unit/app/tools/page.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/app/tools/page.test.tsx`:

```tsx
import ToolsHub from "@/app/tools/page";
import { tools } from "@/content/tools";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ToolsHub", () => {
  it("lists every tool by name", () => {
    render(<ToolsHub />);
    for (const t of tools) {
      expect(screen.getByText(t.name, { exact: false })).toBeDefined();
    }
  });

  it("features the domain dossier with a link to /domain-dossier", () => {
    render(<ToolsHub />);
    const featured = screen.getByRole("link", { name: /domain dossier/i });
    expect(featured.getAttribute("href")).toBe("/domain-dossier");
  });

  it("groups tools by category", () => {
    render(<ToolsHub />);
    expect(screen.getByText(/network/i, { selector: "h2" })).toBeDefined();
    expect(screen.getByText(/dev/i, { selector: "h2" })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `pnpm vitest run tests/unit/app/tools/page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the page**

Create `app/tools/page.tsx`:

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { tools } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "developer + network tools — drwho.me",
  description:
    "free developer and network tools: dns lookup, dmarc checker, spf checker, jwt decoder, base64, url codec, json formatter, and the domain dossier. no ads, no tracking.",
  path: "/tools",
  type: "page",
});

export default function ToolsHub() {
  const network = tools.filter((t) => t.category === "network");
  const dev = tools.filter((t) => t.category === "dev");

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/tools" />
      <TerminalPrompt>tools</TerminalPrompt>

      <section className="space-y-3 border p-4">
        <h2 className="text-sm text-muted">featured</h2>
        <p className="text-sm">
          <Link href={"/domain-dossier" as Route} className="underline">
            domain dossier
          </Link>{" "}
          — run ten checks on any domain in one go: dns, mx, spf, dmarc, dkim, tls,
          redirects, headers, cors, and web surface. one page, one shareable link.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-muted">network</h2>
        <ul className="space-y-2 list-none p-0">
          {network.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}` as Route} className="text-sm">
                <span className="text-accent">{t.name}</span>{" "}
                <span className="text-muted">— {t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-muted">dev</h2>
        <ul className="space-y-2 list-none p-0">
          {dev.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}` as Route} className="text-sm">
                <span className="text-accent">{t.name}</span>{" "}
                <span className="text-muted">— {t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `pnpm vitest run tests/unit/app/tools/page.test.tsx`
Expected: pass.

- [ ] **Step 5: Visit in dev**

Run: `pnpm dev` and open `http://localhost:3000/tools`
Expected: monospace page with featured dossier card, `network` section, `dev` section, all tools linked.

- [ ] **Step 6: Commit**

```bash
git add app/tools/page.tsx tests/unit/app/tools/page.test.tsx
git commit -m "feat(hub): add /tools hub page"
```

---

### Task 6: `/domain-dossier` landing page

**Files:**
- Create: `app/domain-dossier/page.tsx`
- Create: `app/domain-dossier/DomainInput.tsx`
- Create: `tests/unit/app/domain-dossier/DomainInput.test.tsx`
- Create: `tests/unit/app/domain-dossier/page.test.tsx`

- [ ] **Step 1: Write failing test for the DomainInput client form**

Create `tests/unit/app/domain-dossier/DomainInput.test.tsx`:

```tsx
import { DomainInput } from "@/app/domain-dossier/DomainInput";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => push.mockReset());

describe("DomainInput", () => {
  it("navigates to /d/<domain> on submit", () => {
    render(<DomainInput />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "stripe.com" } });
    fireEvent.submit(input.closest("form")!);
    expect(push).toHaveBeenCalledWith("/d/stripe.com");
  });

  it("trims whitespace and lowercases before navigation", () => {
    render(<DomainInput />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "  STRIPE.COM  " } });
    fireEvent.submit(input.closest("form")!);
    expect(push).toHaveBeenCalledWith("/d/stripe.com");
  });

  it("does not navigate on empty submit", () => {
    render(<DomainInput />);
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `DomainInput`**

Create `app/domain-dossier/DomainInput.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DomainInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = value.trim().toLowerCase();
    if (!d) return;
    router.push(`/d/${d}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="example.com"
        className="flex-1 bg-transparent border px-3 py-2 text-sm font-mono outline-none focus:border-accent"
        aria-label="domain"
      />
      <button
        type="submit"
        className="border px-4 py-2 text-sm hover:border-accent"
      >
        run →
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Run DomainInput test — expect pass**

Run: `pnpm vitest run tests/unit/app/domain-dossier/DomainInput.test.tsx`
Expected: pass.

- [ ] **Step 4: Write failing test for the landing page**

Create `tests/unit/app/domain-dossier/page.test.tsx`:

```tsx
import DomainDossier from "@/app/domain-dossier/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { vi } from "vitest";

describe("DomainDossier landing", () => {
  it("renders the hero heading", () => {
    render(<DomainDossier />);
    expect(screen.getByRole("heading", { name: /domain health checker/i })).toBeDefined();
  });

  it("lists all ten check sections", () => {
    render(<DomainDossier />);
    for (const h of ["dns", "mx", "spf", "dmarc", "dkim", "tls", "redirects", "headers", "cors", "web surface"]) {
      expect(screen.getByRole("heading", { name: new RegExp(h, "i") })).toBeDefined();
    }
  });

  it("includes FAQ and SoftwareApplication json-ld", () => {
    const { container } = render(<DomainDossier />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const payloads = Array.from(scripts).map((s) => JSON.parse(s.textContent!));
    expect(payloads.some((p) => p["@type"] === "SoftwareApplication")).toBe(true);
    expect(payloads.some((p) => p["@type"] === "FAQPage")).toBe(true);
  });
});
```

- [ ] **Step 5: Implement the landing page**

Create `app/domain-dossier/page.tsx`:

```tsx
import { DomainInput } from "@/app/domain-dossier/DomainInput";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import {
  buildFaqJsonLd,
  buildSoftwareApplicationJsonLd,
  pageMetadata,
  siteUrl,
} from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "domain health checker — dns, email, tls, headers — drwho.me",
  description:
    "run dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, and web-surface checks on any domain in one page. free, no sign-up.",
  path: "/domain-dossier",
  type: "page",
});

const checks = [
  {
    id: "dns",
    name: "dns",
    tool: "dns-records-lookup",
    body: "a, aaaa, ns, soa, caa, and txt records — everything a resolver asks the authoritative nameserver for.",
  },
  {
    id: "mx",
    name: "mx",
    tool: "mx-lookup",
    body: "the mail exchangers the domain advertises, sorted by priority. shows you which provider runs the inbox.",
  },
  {
    id: "spf",
    name: "spf",
    tool: "spf-checker",
    body: "the sender policy framework txt record that tells recipient mail servers which ips may send mail for this domain.",
  },
  {
    id: "dmarc",
    name: "dmarc",
    tool: "dmarc-checker",
    body: "the policy published at _dmarc.<domain> — p=none/quarantine/reject, alignment, and reporting addresses.",
  },
  {
    id: "dkim",
    name: "dkim",
    tool: "dkim-lookup",
    body: "probes the most common dkim selectors (default, google, k1, selector1/2, mxvault) to find the public key.",
  },
  {
    id: "tls",
    name: "tls",
    tool: "tls-certificate-checker",
    body: "subject, issuer, sans, fingerprint, and expiry for the certificate served over :443.",
  },
  {
    id: "redirects",
    name: "redirects",
    tool: "redirect-checker",
    body: "traces the http(s) redirect chain from https://<domain>/ up to ten hops.",
  },
  {
    id: "headers",
    name: "headers",
    tool: "security-headers-checker",
    body: "hsts, csp, x-frame-options, x-content-type-options, referrer-policy, permissions-policy — every header on /.",
  },
  {
    id: "cors",
    name: "cors",
    tool: "cors-checker",
    body: "runs a preflight options request and surfaces the access-control-* response headers.",
  },
  {
    id: "web surface",
    name: "web surface",
    tool: "web-surface-inspector",
    body: "fetches robots.txt, sitemap.xml, and the home page <head> to summarise the domain's public web surface.",
  },
];

const faq = [
  {
    q: "Is the dossier free?",
    a: "Yes. No sign-up, no rate limit signup, no ads. A soft rate limit of 30 requests per hour per ip is applied to keep the public infrastructure responsive.",
  },
  {
    q: "Does drwho.me store the domains I check?",
    a: "No. Results are cached per check so a second visitor doesn't re-run the same dns queries, but we don't tie the lookups to users or track who searched what.",
  },
  {
    q: "Can I use this in a ci pipeline?",
    a: "Use the MCP endpoint at /mcp for programmatic access. Each check is also available as a standalone page under /tools/.",
  },
  {
    q: "How fresh are the results?",
    a: "Each check has its own ttl (15 minutes for http probes, 1 hour for dns, 6 hours for tls certificates). Append ?refresh=1 to force a re-run.",
  },
];

export default function DomainDossier() {
  const url = siteUrl();
  const app = buildSoftwareApplicationJsonLd({
    name: "drwho.me domain dossier",
    description:
      "free web-based domain health checker — dns, email authentication (spf, dkim, dmarc), tls, redirects, headers, cors, and web-surface in one report.",
    path: "/domain-dossier",
    siteUrl: url,
  });
  const faqJson = buildFaqJsonLd(faq);

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/domain-dossier" />
      <TerminalPrompt>domain dossier</TerminalPrompt>

      <section className="space-y-3">
        <h1 className="text-lg">domain health checker</h1>
        <p className="text-sm text-muted">
          run ten independent checks on any domain — dns, email authentication, tls,
          redirects, headers, cors, and public-web surface — in one page.
        </p>
        <DomainInput />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm text-muted">what it checks</h2>
        {checks.map((c) => (
          <div key={c.id} className="space-y-1 border-t pt-3">
            <h3 className="text-sm">
              <Link href={`/tools/${c.tool}` as Route} className="text-accent">
                {c.name}
              </Link>
            </h3>
            <p className="text-sm text-muted">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">who uses it</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>devops preparing a domain transfer or dns migration</li>
          <li>email deliverability engineers auditing spf/dkim/dmarc alignment</li>
          <li>security teams reviewing http headers and tls configuration</li>
          <li>anyone pointing a new domain at production for the first time</li>
        </ul>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">read more</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <Link href={"/blog/what-is-dmarc" as Route}>what is dmarc?</Link>
          </li>
          <li>
            <Link href={"/blog/spf-10-lookup-limit" as Route}>
              the spf 10-lookup limit
            </Link>
          </li>
          <li>
            <Link href={"/blog/email-deliverability-checklist" as Route}>
              email deliverability checklist
            </Link>
          </li>
          <li>
            <Link href={"/blog/security-headers-guide" as Route}>
              security headers every site should have in 2026
            </Link>
          </li>
        </ul>
      </section>

      <JsonLd data={app} />
      <JsonLd data={faqJson} />
    </article>
  );
}
```

- [ ] **Step 6: Run landing page test**

Run: `pnpm vitest run tests/unit/app/domain-dossier/page.test.tsx`
Expected: pass.

- [ ] **Step 7: Run the sitemap test again**

Run: `pnpm vitest run tests/unit/app/sitemap.test.ts`
Expected: `/tools` and `/domain-dossier` assertions now pass. `/mcp/*` and `dmarc-checker` still fail — still expected.

- [ ] **Step 8: Commit**

```bash
git add app/domain-dossier/page.tsx app/domain-dossier/DomainInput.tsx tests/unit/app/domain-dossier/page.test.tsx tests/unit/app/domain-dossier/DomainInput.test.tsx
git commit -m "feat(dossier): add /domain-dossier landing page"
```

---

**Phase 1 checkpoint.** Run `pnpm test` (unit + e2e). Expected failures are limited to the sitemap slug assertion (`dmarc-checker`) and `/mcp/*` — everything else green. Verify OG preview with a staging deploy or `pnpm build && pnpm start` and a social-debug tool (e.g. `https://www.opengraph.xyz/?url=https://staging-url/d/stripe.com`).

---

## Phase 2 — Slug rename + Wave 1 blog posts

### Task 7: Rename dossier tool slugs + add redirects

Ten slugs flip to search-friendly names. Every reference in the codebase updates. Redirects preserve indexed URLs.

| Old | New |
|---|---|
| `dossier-dns` | `dns-records-lookup` |
| `dossier-mx` | `mx-lookup` |
| `dossier-spf` | `spf-checker` |
| `dossier-dmarc` | `dmarc-checker` |
| `dossier-dkim` | `dkim-lookup` |
| `dossier-tls` | `tls-certificate-checker` |
| `dossier-redirects` | `redirect-checker` |
| `dossier-headers` | `security-headers-checker` |
| `dossier-cors` | `cors-checker` |
| `dossier-web-surface` | `web-surface-inspector` |

**Files:**
- Modify: `content/tools.ts`
- Modify: `content/tool-seo.ts`
- Modify: `lib/dossier/registry.ts`
- Modify: `app/d/[domain]/page.tsx`
- Modify: `next.config.ts`
- Modify: `tests/unit/content/tools.test.ts` (if present)
- Modify: `tests/unit/content/tool-seo.test.ts` (if present)

- [ ] **Step 1: Rename slug fields in `content/tools.ts`**

In `content/tools.ts`, change the 10 dossier entries. For each entry:
- Set `slug` to the new slug
- Set `name` to the new human name

The full diff to apply (in order, matching existing entries):

```ts
// Before: slug: "dossier-dns", name: "dossier / dns"
// After:
{ slug: "dns-records-lookup", name: "dns records lookup", ... },

// Before: slug: "dossier-mx", name: "dossier / mx"
// After:
{ slug: "mx-lookup", name: "mx lookup", ... },

// Before: slug: "dossier-spf", name: "dossier / spf"
// After:
{ slug: "spf-checker", name: "spf checker", ... },

// Before: slug: "dossier-dmarc", name: "dossier / dmarc"
// After:
{ slug: "dmarc-checker", name: "dmarc checker", ... },

// Before: slug: "dossier-dkim", name: "dossier / dkim"
// After:
{ slug: "dkim-lookup", name: "dkim lookup", ... },

// Before: slug: "dossier-tls", name: "dossier / tls"
// After:
{ slug: "tls-certificate-checker", name: "tls certificate checker", ... },

// Before: slug: "dossier-redirects", name: "dossier / redirects"
// After:
{ slug: "redirect-checker", name: "redirect checker", ... },

// Before: slug: "dossier-headers", name: "dossier / headers"
// After:
{ slug: "security-headers-checker", name: "security headers checker", ... },

// Before: slug: "dossier-cors", name: "dossier / cors"
// After:
{ slug: "cors-checker", name: "cors checker", ... },

// Before: slug: "dossier-web-surface", name: "dossier / web surface"
// After:
{ slug: "web-surface-inspector", name: "web surface inspector", ... },
```

Keywords, description, component, category, and `mcpNames` stay unchanged.

- [ ] **Step 2: Rename record keys in `content/tool-seo.ts`**

Open `content/tool-seo.ts`, find the `toolContent` object, and rename the 10 keys:

```
dossier-dns            → dns-records-lookup
dossier-mx             → mx-lookup
dossier-spf            → spf-checker
dossier-dmarc          → dmarc-checker
dossier-dkim           → dkim-lookup
dossier-tls            → tls-certificate-checker
dossier-redirects      → redirect-checker
dossier-headers        → security-headers-checker
dossier-cors           → cors-checker
dossier-web-surface    → web-surface-inspector
```

If any value inside a tool's content body references an old slug (e.g. inside `related: [...]`), update those references too. Check with `rg "dossier-" content/tool-seo.ts` after the renames — should return zero matches.

- [ ] **Step 3: Update `toolSlug` fields in `lib/dossier/registry.ts`**

In `lib/dossier/registry.ts`, the `raw` array's 10 entries each have a `toolSlug` field. Update them:

```ts
const raw: Raw[] = [
  { id: "dns", title: "dns", toolSlug: "dns-records-lookup", ttlSeconds: 3600, fn: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "mx-lookup", ttlSeconds: 3600, fn: mxCheck },
  { id: "spf", title: "spf", toolSlug: "spf-checker", ttlSeconds: 3600, fn: spfCheck },
  { id: "dmarc", title: "dmarc", toolSlug: "dmarc-checker", ttlSeconds: 3600, fn: dmarcCheck },
  { id: "dkim", title: "dkim", toolSlug: "dkim-lookup", ttlSeconds: 900, fn: (d: string) => dkimCheck(d) },
  { id: "tls", title: "tls", toolSlug: "tls-certificate-checker", ttlSeconds: 21600, fn: tlsCheck },
  { id: "redirects", title: "redirects", toolSlug: "redirect-checker", ttlSeconds: 900, fn: redirectsCheck },
  { id: "headers", title: "headers", toolSlug: "security-headers-checker", ttlSeconds: 900, fn: headersCheck },
  { id: "cors", title: "cors", toolSlug: "cors-checker", ttlSeconds: 900, fn: (d: string) => corsCheck(d) },
  { id: "web-surface", title: "web-surface", toolSlug: "web-surface-inspector", ttlSeconds: 900, fn: webSurfaceCheck },
];
```

- [ ] **Step 4: Update `toolSlug` props in `app/d/[domain]/page.tsx`**

Find the 10 `<SectionSkeleton ... toolSlug="dossier-X"` occurrences and replace the values:

```tsx
toolSlug="dossier-mx"              → toolSlug="mx-lookup"
toolSlug="dossier-spf"             → toolSlug="spf-checker"
toolSlug="dossier-dmarc"           → toolSlug="dmarc-checker"
toolSlug="dossier-dkim"            → toolSlug="dkim-lookup"
toolSlug="dossier-tls"             → toolSlug="tls-certificate-checker"
toolSlug="dossier-redirects"       → toolSlug="redirect-checker"
toolSlug="dossier-headers"         → toolSlug="security-headers-checker"
toolSlug="dossier-cors"            → toolSlug="cors-checker"
toolSlug="dossier-web-surface"     → toolSlug="web-surface-inspector"
```

(The `dns` section uses `DnsSectionSkeleton`, which reads from `dossierChecks` via the registry — no hard-coded slug, updates transitively.)

- [ ] **Step 5: Add permanent redirects in `next.config.ts`**

Edit `next.config.ts`. Keep the existing `output: "standalone"` and `htmlLimitedBots: /.*/` — they are load-bearing (standalone is for Docker; htmlLimitedBots prevents the Lighthouse SEO regression from streamed metadata). Replace the `config` block with:

```ts
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  output: "standalone",
  htmlLimitedBots: /.*/,
  async redirects() {
    const map: Array<[string, string]> = [
      ["dossier-dns", "dns-records-lookup"],
      ["dossier-mx", "mx-lookup"],
      ["dossier-spf", "spf-checker"],
      ["dossier-dmarc", "dmarc-checker"],
      ["dossier-dkim", "dkim-lookup"],
      ["dossier-tls", "tls-certificate-checker"],
      ["dossier-redirects", "redirect-checker"],
      ["dossier-headers", "security-headers-checker"],
      ["dossier-cors", "cors-checker"],
      ["dossier-web-surface", "web-surface-inspector"],
    ];
    return map.map(([from, to]) => ({
      source: `/tools/${from}`,
      destination: `/tools/${to}`,
      permanent: true,
    }));
  },
};
```

- [ ] **Step 6: Grep sanity check**

Run: `rg "dossier-(dns|mx|spf|dmarc|dkim|tls|redirects|headers|cors|web-surface)" --type ts --type tsx --type mdx`
Expected: zero matches inside `content/`, `app/`, `components/`, and `lib/`. Matches are acceptable only in:
- `next.config.ts` (redirect sources)
- Tests you haven't yet updated

- [ ] **Step 7: Update unit tests that hard-code old slugs**

Find them:
```bash
rg "dossier-(dns|mx|spf|dmarc|dkim|tls|redirects|headers|cors|web-surface)" tests/
```

Update each hit — typical fixtures are in `tests/unit/content/tools.test.ts`, `tests/unit/content/tool-seo.test.ts`, and any dossier section test that references a `toolSlug`. Replace old slugs with new ones. The sitemap test from Task 4 already uses `dmarc-checker`.

- [ ] **Step 8: Run the full unit suite**

Run: `pnpm vitest run`
Expected: all green.

- [ ] **Step 9: Run E2E**

Run: `pnpm exec playwright test`
Expected: all green. In particular, `tests/e2e/dossier.spec.ts` should still pass — section skeleton rendering uses the new slugs via the registry.

- [ ] **Step 10: Manual check — redirect lives**

Run: `pnpm build && pnpm start` in one terminal; in another:
```bash
curl -sI http://localhost:3000/tools/dossier-dmarc | head -5
```
Expected: `HTTP/1.1 308 Permanent Redirect` with `location: /tools/dmarc-checker`.

- [ ] **Step 11: Commit**

```bash
git add content/tools.ts content/tool-seo.ts lib/dossier/registry.ts app/d/[domain]/page.tsx next.config.ts tests/
git commit -m "refactor(tools): rename dossier slugs to search-friendly names"
```

---

### Task 8: `ToolCtaLink` blog CTA component

**Files:**
- Create: `components/blog/ToolCtaLink.tsx`
- Create: `tests/unit/components/blog/ToolCtaLink.test.tsx`

The component wraps a `<Link>` and fires `trackBlogToolClick(postSlug, toolSlug)` on click. Used inside MDX posts.

- [ ] **Step 1: Write failing test**

Create `tests/unit/components/blog/ToolCtaLink.test.tsx`:

```tsx
import { ToolCtaLink } from "@/components/blog/ToolCtaLink";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("ToolCtaLink", () => {
  it("links to /tools/<slug>", () => {
    render(
      <ToolCtaLink postSlug="what-is-dmarc" toolSlug="dmarc-checker">
        check now →
      </ToolCtaLink>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tools/dmarc-checker");
  });

  it("fires blog_tool_click on click", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(
      <ToolCtaLink postSlug="what-is-dmarc" toolSlug="dmarc-checker">
        check now →
      </ToolCtaLink>,
    );
    fireEvent.click(screen.getByRole("link"));
    expect(gtag).toHaveBeenCalledWith("event", "blog_tool_click", {
      post_slug: "what-is-dmarc",
      tool_slug: "dmarc-checker",
    });
  });
});
```

- [ ] **Step 2: Implement the component**

Create `components/blog/ToolCtaLink.tsx`:

```tsx
"use client";

import { trackBlogToolClick } from "@/lib/analytics/client";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  postSlug: string;
  toolSlug: string;
  children: ReactNode;
};

export function ToolCtaLink({ postSlug, toolSlug, children }: Props) {
  return (
    <Link
      href={`/tools/${toolSlug}` as Route}
      onClick={() => trackBlogToolClick(postSlug, toolSlug)}
      className="inline-block border px-4 py-2 my-4 text-sm hover:border-accent"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Run test**

Run: `pnpm vitest run tests/unit/components/blog/ToolCtaLink.test.tsx`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/blog/ToolCtaLink.tsx tests/unit/components/blog/ToolCtaLink.test.tsx
git commit -m "feat(blog): add ToolCtaLink component"
```

---

### Task 9–16: Wave 1 dossier-wedge blog posts (8 posts)

These eight tasks share a structure. For each: create the MDX file with frontmatter + 800–1200 word body + CTA, then register in `content/posts.ts`, then commit. The body outlines below specify H2 sections, key technical facts to cover, and the exact CTA block — follow them verbatim to keep quality consistent.

**Every post** imports `ToolCtaLink` at the top:

```mdx
import { ToolCtaLink } from "@/components/blog/ToolCtaLink";
```

**Post registration template** — for each new post, add two lines to `content/posts.ts`:

```ts
// At the top with the other imports (keep alphabetical):
import Dmarc, { frontmatter as dmarcFm } from "@/content/posts/what-is-dmarc.mdx";

// Inside the `posts` array (order doesn't matter — sorted by date):
record("what-is-dmarc", dmarcFm, Dmarc),
```

---

#### Task 9: `what-is-dmarc.mdx`

**Files:**
- Create: `content/posts/what-is-dmarc.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

Create `content/posts/what-is-dmarc.mdx`:

```mdx
---
title: "What is DMARC? (and how to check if yours is configured correctly)"
date: "2026-04-25"
description: DMARC is the email-authentication policy layer that tells receiving mail servers what to do when an SPF or DKIM check fails. This post covers the record format, policy levels, reporting, and how to verify your setup in thirty seconds.
tags: [dmarc, email, spf, dkim, deliverability]
relatedTool: dmarc-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

DMARC stands for Domain-based Message Authentication, Reporting, and Conformance. It is the layer on top of SPF and DKIM that tells receiving mail servers what to do when one or both of those checks fail. Without a DMARC record, receivers fall back to their own heuristics — which is why a freshly registered domain can legitimately impersonate yours unless you publish a policy.

## The record format

A DMARC record is a TXT record published at `_dmarc.<yourdomain>`. The minimum usable record looks like this:

\`\`\`
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
\`\`\`

Three fields, three jobs:

- `v=DMARC1` — the version tag. Always this exact string.
- `p=none` — the policy. Tells receivers what to do with failing mail: `none` (collect reports, deliver anyway), `quarantine` (spam folder), or `reject` (bounce at the SMTP edge).
- `rua=mailto:...` — the aggregate report address. Major receivers (Google, Microsoft, Yahoo) send XML reports here every 24 hours listing which IPs sent mail claiming to be from your domain.

Optional fields layer on top: `sp` for subdomain policy, `adkim`/`aspf` for alignment mode (`s` strict, `r` relaxed), `pct` for partial rollout, `ruf` for per-message forensic reports, `fo` for failure-report options.

## What alignment actually means

DMARC passes if *either* SPF or DKIM passes **and** the authenticated domain aligns with the `From:` header domain.

Alignment is the piece people miss. SPF can pass because the mail relay is in your SPF record, but if the `return-path` domain is your ESP's bounce domain and not your brand domain, SPF alignment fails. DKIM can pass because your ESP signed the message, but if the `d=` tag in the signature is the ESP's domain, DKIM alignment fails. DMARC requires that the passing mechanism used *your* domain.

Relaxed alignment (`adkim=r`, the default) lets subdomains count: `mail.example.com` aligns with `example.com`. Strict alignment requires an exact match. Most setups use relaxed.

## Rolling out a policy

The recommended rollout sequence is `p=none` → `p=quarantine; pct=10` → ramp `pct` up → `p=quarantine; pct=100` → `p=reject`. Each step gives you time to read aggregate reports and find unauthenticated mail streams you did not know you had (a forgotten marketing platform, a legacy crm, a misconfigured transactional service). Moving to `p=reject` while legitimate mail still fails alignment bounces your own traffic — the DMARC equivalent of a forward-deployed self-inflicted DoS.

Most domains stay at `p=none` for a month before moving. Aim for at least two full weekly cycles at each level.

## What the aggregate report tells you

The daily XML from Google, Microsoft, and Yahoo lists: sending IP, SPF result, DKIM result, DMARC result, and message count per (sender, disposition) tuple. It does not contain message bodies, subject lines, or recipients — only the envelope-level fields.

Read reports for a week and you will find three things:
1. Your legitimate senders, now properly aligned.
2. Legitimate-but-forgotten senders that need to be added to SPF or signed with DKIM.
3. Actual impersonation attempts — spikes of traffic from random IPs claiming to send from your domain.

The third category is why DMARC exists. Before you deploy DMARC, you have no visibility into (3) at all.

## How to check your record in thirty seconds

The fastest way is a one-line dig:

\`\`\`
dig +short TXT _dmarc.example.com
\`\`\`

If the response is empty, you have no DMARC record. If the response is a quoted string starting `v=DMARC1`, parse the fields: policy, alignment, reporting address.

Common mistakes the tool catches:

- **No record at all.** The most common state. Receivers fall back to per-provider heuristics.
- **Syntax error.** A missing semicolon, a trailing comma, or a stray `p =  reject` with spaces. The DNS lookup succeeds but receivers ignore the record.
- **Bad reporting address.** `rua=dmarc@example.com` without the `mailto:` prefix is invalid.
- **External report authorization missing.** If `rua=mailto:reports@other-domain.com`, the other domain must publish `_report._dmarc.yourdomain.com` authorizing it — otherwise reports are silently dropped.

<ToolCtaLink postSlug="what-is-dmarc" toolSlug="dmarc-checker">
  Check your DMARC record now →
</ToolCtaLink>

## Further reading

- [Email deliverability checklist: SPF, DKIM, and DMARC in order](/blog/email-deliverability-checklist)
- [The SPF 10-lookup limit](/blog/spf-10-lookup-limit)
- RFC 7489 — Domain-based Message Authentication, Reporting, and Conformance
```

- [ ] **Step 2: Register in `content/posts.ts`**

Add to the imports section (alphabetical by variable name):

```ts
import Dmarc, { frontmatter as dmarcFm } from "@/content/posts/what-is-dmarc.mdx";
```

Add to the `posts` array:

```ts
record("what-is-dmarc", dmarcFm, Dmarc),
```

- [ ] **Step 3: Run the posts unit test to confirm parsing**

Run: `pnpm vitest run tests/unit/content/posts.test.ts`
Expected: pass (frontmatter validates as ISO date, required fields present).

- [ ] **Step 4: Visit in dev**

Run: `pnpm dev` and open `http://localhost:3000/blog/what-is-dmarc`
Expected: post renders, CTA button appears, clicking it navigates to `/tools/dmarc-checker`.

- [ ] **Step 5: Commit**

```bash
git add content/posts/what-is-dmarc.mdx content/posts.ts
git commit -m "docs(blog): add what-is-dmarc post"
```

---

#### Task 10: `spf-10-lookup-limit.mdx`

**Files:**
- Create: `content/posts/spf-10-lookup-limit.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "The SPF 10-lookup limit: what it means and how to fix it"
date: "2026-04-26"
description: RFC 7208 caps SPF evaluation at ten DNS lookups. Exceed that and your SPF record returns PermError, which DMARC treats as a hard fail. This post covers why the limit exists, how include chains explode the count, and three practical fixes.
tags: [spf, email, dns, deliverability]
relatedTool: spf-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Section 4.6.4 of RFC 7208 caps an SPF record evaluation at ten DNS lookups. Go over and the evaluator returns `permerror`, which DMARC treats as a hard authentication failure. Most deliverability problems that look like "SPF is broken" are actually "SPF is evaluating but hitting the limit."

## Why the limit exists

SPF records can nest: an `include:` mechanism pulls in another domain's SPF, which can itself contain more `include:` or `a`/`mx`/`exists`/`ptr` lookups. Without a cap a single lookup could trigger unbounded DNS traffic. Ten is the RFC's chosen balance between expressive-enough-to-be-useful and bounded-enough-to-be-safe.

The count includes:
- every `include:` mechanism
- every `a` and `mx` mechanism (each `mx` charges one for the MX lookup plus one per returned host)
- every `exists` mechanism
- every `redirect=` modifier
- `ptr` (which is deprecated and you should remove anyway)

It does not include the initial TXT lookup for the SPF record itself, `ip4:` and `ip6:` mechanisms (those are inline), or the `all` mechanism.

## How include chains explode

The sneaky part: a `include:spf.google.com` counts as one lookup **in your record**, but when the evaluator resolves `spf.google.com`, its record contains more `include:` mechanisms. Those each count against your budget too.

A real-world example: Google Workspace's `_spf.google.com` expands to `include:_netblocks.google.com`, `include:_netblocks2.google.com`, `include:_netblocks3.google.com`. That is four lookups from one `include:spf.google.com`. Add Microsoft 365's `include:spf.protection.outlook.com` (one lookup), SendGrid's `include:sendgrid.net` (one), Mailchimp's `include:servers.mcsv.net` (one), and a couple of transactional senders and you are at the limit before you have added your own infrastructure.

## How to measure your current count

A manual walk:

1. Resolve `example.com` TXT, find the `v=spf1` record.
2. For each mechanism, count it against the budget.
3. For each `include:`, resolve that domain's SPF and recurse.

Tools automate this — point one at your domain and it returns the total. If you are over ten, it returns `permerror` and lists which mechanisms pushed you over.

## Three fixes

**Fix 1: audit and remove.** The highest-leverage fix is usually deletion. List every `include:` against actual sending traffic from the DMARC aggregate reports. A `include:` for a platform you stopped using a year ago still eats a lookup. Most domains can drop two or three mechanisms with no deliverability impact.

**Fix 2: flatten.** Replace `include:` chains with inline `ip4:`/`ip6:` ranges. The platform publishes its sending IPs; you pin them in your SPF. This works but breaks the day the platform changes their IP ranges without telling you. Only do this if you monitor a feed of changes or run an automated flattener on a cron.

**Fix 3: DKIM-first alignment.** DMARC only requires *one* of SPF or DKIM to pass with alignment. If all your important senders sign with DKIM using your domain, SPF failures for those same senders stop mattering. This is the modern approach: rely on DKIM for alignment and use SPF as a soft signal.

Flattening and DKIM-first each have trade-offs. The "permerror" state is always worse than either fix.

<ToolCtaLink postSlug="spf-10-lookup-limit" toolSlug="spf-checker">
  Check your SPF lookup count →
</ToolCtaLink>

## Further reading

- [What is DMARC?](/blog/what-is-dmarc)
- [Email deliverability checklist](/blog/email-deliverability-checklist)
- RFC 7208 — Sender Policy Framework (especially §4.6.4)
```

- [ ] **Step 2: Register in `content/posts.ts`**

```ts
import Spf10, { frontmatter as spf10Fm } from "@/content/posts/spf-10-lookup-limit.mdx";
// ...
record("spf-10-lookup-limit", spf10Fm, Spf10),
```

- [ ] **Step 3: Tests + commit**

Run: `pnpm vitest run tests/unit/content/posts.test.ts` — pass.

```bash
git add content/posts/spf-10-lookup-limit.mdx content/posts.ts
git commit -m "docs(blog): add spf 10-lookup-limit post"
```

---

#### Task 11: `dkim-selectors-explained.mdx`

**Files:**
- Create: `content/posts/dkim-selectors-explained.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "DKIM selectors explained: how email signing actually works"
date: "2026-04-27"
description: DKIM signatures are signed by a key identified by a selector, but the selector is not documented anywhere your receivers can find. This post explains how selectors work, why discovery is hard, and which selectors the common senders use.
tags: [dkim, email, dns, cryptography]
relatedTool: dkim-lookup
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

DKIM (DomainKeys Identified Mail, RFC 6376) signs outgoing email with a private key held by the sending server. The receiver verifies the signature against a public key published in DNS. Simple in principle — until you ask where the public key lives, and the answer is "at a name only the sender knows."

## The selector mechanism

A DKIM signature header looks like this:

\`\`\`
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=selector1;
  c=relaxed/relaxed; h=from:to:subject:date;
  bh=...; b=...
\`\`\`

The `d=` tag is the signing domain. The `s=` tag is the **selector**. The public key is published at `<selector>._domainkey.<domain>`. So for the signature above, the receiver looks up `selector1._domainkey.example.com` and finds a TXT record like:

\`\`\`
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ...
\`\`\`

The `p=` value is the base64-encoded public key. The receiver verifies the `b=` signature from the header against the message body hash (`bh=`) using this key.

## Why selectors exist

Selectors let a domain rotate keys and run multiple senders without re-issuing keys globally. You can:

- Sign with `selector2025` for two years, then publish `selector2026` alongside and start signing with it.
- Let Postmark sign with `pm._domainkey.example.com` while Sendgrid signs with `s1._domainkey.example.com`.
- Retire a key by removing its DNS record — the next signed message with the old selector fails verification, rest of your mail keeps flowing.

The design is clean. The discovery story is not.

## The discovery problem

There is no registry of selectors. You cannot enumerate them. DNS does not let you list everything under `_domainkey.<domain>`; the zone is effectively opaque except for names you already know to query.

In practice everyone ends up probing a handful of common selectors:

| Selector | Sender |
|---|---|
| `google` | Google Workspace (default for Workspace domains) |
| `selector1`, `selector2` | Microsoft 365 (primary/rotation pair) |
| `k1`, `k2`, `k3` | Mailchimp, Mandrill, some older platforms |
| `mxvault` | MX-level signing on some ESPs |
| `default` | Self-hosted Postfix/OpenDKIM defaults |
| `pm` | Postmark |
| `scph0920` (or similar timestamp) | SparkPost (dated selectors) |
| `s1`, `s2` | SendGrid (later rotated) |

If the domain uses something custom (e.g. `auth01._domainkey.example.com`), the only way to find it is to observe a real signed message and parse the `DKIM-Signature` header.

## What "valid" means

The TXT at `<selector>._domainkey.<domain>` must contain at minimum:

- `v=DKIM1` — version tag (optional but recommended; absent is treated as DKIM1).
- `k=rsa` — key type. `ed25519` is the modern alternative (RFC 8463) but ecosystem support lagged for years; RSA is still the safe default.
- `p=<base64>` — the public key itself.

An empty `p=` (i.e. `v=DKIM1; k=rsa; p=`) means "this key is revoked, reject any signature that uses it." This is how you retire a selector safely without deleting the record immediately.

Common problems a tool catches:

- **No record at all.** Selector does not exist. Receivers treat the signature as failed.
- **`p=` missing or malformed.** Base64 with stray line breaks from copy-pasting is the usual culprit. DNS servers split long TXT records into multiple chunks — the concatenation must be correct.
- **Wrong key size.** 1024-bit RSA keys are still accepted but deprecated; 2048-bit is the minimum anyone should be using in 2026.

<ToolCtaLink postSlug="dkim-selectors-explained" toolSlug="dkim-lookup">
  Probe common DKIM selectors for a domain →
</ToolCtaLink>

## Further reading

- [What is DMARC?](/blog/what-is-dmarc)
- [Email deliverability checklist](/blog/email-deliverability-checklist)
- RFC 6376 — DomainKeys Identified Mail Signatures
- RFC 8463 — ed25519 keys for DKIM
```

- [ ] **Step 2: Register in `content/posts.ts`**

```ts
import Dkim, { frontmatter as dkimFm } from "@/content/posts/dkim-selectors-explained.mdx";
// ...
record("dkim-selectors-explained", dkimFm, Dkim),
```

- [ ] **Step 3: Tests + commit**

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/dkim-selectors-explained.mdx content/posts.ts
git commit -m "docs(blog): add dkim selectors post"
```

---

#### Task 12: `email-deliverability-checklist.mdx`

**Files:**
- Create: `content/posts/email-deliverability-checklist.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "Email deliverability checklist: SPF, DKIM, and DMARC in order"
date: "2026-04-28"
description: If your transactional email keeps landing in spam, the problem is almost always an authentication stack that is incomplete or misaligned. This checklist walks SPF, DKIM, and DMARC in the order you should configure them, with verification checks at each step.
tags: [email, spf, dkim, dmarc, deliverability]
relatedTool: spf-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Most "my emails are going to spam" threads end with one of three answers: SPF is missing, DKIM is unaligned, or DMARC reports are being ignored. Configure them in order and verify each step before moving to the next. Skipping ahead is how domains end up with a DMARC policy rejecting their own legitimate mail.

## Step 1: Inventory every sender

Before any DNS change, list every service that sends mail claiming to be from your domain: the primary mailbox provider (Google Workspace or Microsoft 365), the transactional ESP (SendGrid, Postmark, AWS SES), the marketing platform (Mailchimp, Customer.io, Klaviyo), and the long tail (your crm that sends receipts, your support tool, that one legacy php script that nobody wants to touch).

Write them down. The aggregate DMARC report will surface anything you miss, but starting from a real list cuts the audit time in half.

## Step 2: Publish SPF

Create a TXT record at the apex domain:

\`\`\`
v=spf1 include:_spf.google.com include:sendgrid.net include:servers.mcsv.net ~all
\`\`\`

Adjust `include:` for your senders. End with `~all` (soft fail) during rollout; move to `-all` (hard fail) after DMARC reports confirm all legitimate senders pass.

Verify:
- Total DNS lookup count stays under ten (see [the SPF 10-lookup-limit post](/blog/spf-10-lookup-limit)).
- The record is on the apex, not a subdomain (unless you explicitly want subdomain-only coverage).
- No more than one `v=spf1` record exists — two records means receivers use the first they parse, which is undefined behavior.

## Step 3: Enable DKIM for every sender

Each sending platform has a "verify sending domain" flow that gives you one or more CNAME or TXT records to publish at `<selector>._domainkey.<domain>`. Publish them all. Send a test message through each platform and confirm the `DKIM-Signature` header in the received message has `d=<yourdomain>` (not `d=<esp-domain>`).

If `d=` is the ESP's domain, DKIM is passing but **not aligned with your domain**, which means DMARC will not consider it. This is the single most common deliverability bug in 2026.

## Step 4: Deploy DMARC at `p=none`

Publish a TXT record at `_dmarc.<domain>`:

\`\`\`
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
\`\`\`

`p=none` means "collect reports, take no enforcement action." This is the right starting state — you want visibility first, policy second.

Wait two weeks. Read every aggregate report. Look for:

- Legitimate senders failing alignment.
- Unknown IPs sending mail as your domain (either unmanaged internal senders or outright impersonation).

## Step 5: Ramp to `p=quarantine`

Once the reports are clean, move to partial quarantine:

\`\`\`
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc-reports@yourdomain.com
\`\`\`

`pct=10` applies the policy to 10% of failing mail. Watch reports for a week, ramp to 25, 50, 75, 100.

## Step 6: Move to `p=reject`

After a full cycle at `p=quarantine; pct=100` with clean reports:

\`\`\`
v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com
\`\`\`

At this point impersonation attempts are rejected at the recipient's SMTP edge. Your own legitimate mail is aligned and unaffected.

## Verification at each step

Run the dossier on your domain between steps. If any check goes from green to red, pause the rollout until you understand why.

<ToolCtaLink postSlug="email-deliverability-checklist" toolSlug="spf-checker">
  Run the full email authentication check on your domain →
</ToolCtaLink>

## Further reading

- [What is DMARC?](/blog/what-is-dmarc)
- [The SPF 10-lookup limit](/blog/spf-10-lookup-limit)
- [DKIM selectors explained](/blog/dkim-selectors-explained)
```

- [ ] **Step 2–3: Register + commit**

```ts
import Deliv, { frontmatter as delivFm } from "@/content/posts/email-deliverability-checklist.mdx";
// ...
record("email-deliverability-checklist", delivFm, Deliv),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/email-deliverability-checklist.mdx content/posts.ts
git commit -m "docs(blog): add email deliverability checklist"
```

---

#### Task 13: `debug-redirect-chain.mdx`

**Files:**
- Create: `content/posts/debug-redirect-chain.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "How to debug a redirect chain (and why it matters for SEO)"
date: "2026-04-29"
description: Long redirect chains bleed SEO link equity, eat mobile latency, and mask misconfiguration. This post walks through how browsers and crawlers handle redirects, what counts as too many hops, and how to trace a chain end-to-end.
tags: [redirects, http, seo, performance]
relatedTool: redirect-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

A redirect chain is any request that returns a `3xx` response that points to another URL which itself returns another `3xx`, and so on until a `200`. Each hop is a full TCP + TLS + HTTP round trip; each hop is a chance for something to break; each hop dilutes the signal search crawlers use to attribute link equity. Long chains are a quiet source of traffic loss.

## What browsers and crawlers actually do

Chrome and Firefox stop after roughly 20 redirects and show an error page. Safari stops at 16. Most HTTP libraries default to 10 or less; `curl` defaults to unlimited unless you set `--max-redirs`.

Search crawlers are stricter. Google Search Central documents "up to five redirects" as the reliable limit before a URL is treated as uncrawlable for that fetch. Bingbot has a similar threshold. Anything past that either gets dropped from the index or costs a second crawler visit to resolve, which hurts crawl budget.

## The five-hop budget

The practical target in 2026: one redirect. A `http://` → `https://` upgrade, a naked `example.com` → `www.example.com` (or the inverse), or a trailing-slash normalization. Two hops is acceptable. Three starts costing. Five is where SEO problems become measurable.

Common patterns that quietly blow the budget:

1. `http://example.com` → `https://example.com` → `https://www.example.com` → `https://www.example.com/en` → `https://www.example.com/en/home` → landed. Five hops from a plain http link.
2. Third-party link trackers: `utm.example.com/abc` → `example.com/abc` → `www.example.com/abc` → canonical. Three hops before the campaign URL reaches the real landing page.
3. Mixed-case domain names forcing a normalization hop (`Example.com` → `example.com`) in middleware you forgot you had.

## How to trace a chain

Use `curl -I -L` with verbose output:

\`\`\`
curl -ILsk -A "Mozilla/5.0" https://example.com 2>&1 | grep -E 'HTTP/|^Location:'
\`\`\`

For each hop, record:
- status code (`301`, `302`, `307`, `308`)
- `location` header target
- any `cache-control` differences between hops (crawlers cache `301`s aggressively; `302` is re-requested every time)

The status code matters: `301` and `308` are permanent (index the target); `302` and `307` are temporary (keep indexing the source). A `302` where you meant `301` means search engines keep requesting the old URL indefinitely.

## Common fixes

**Collapse protocol + subdomain hops.** Publish the apex canonical (`example.com` or `www.example.com`) and do a single redirect at the edge. HSTS preload handles the http→https upgrade after the first visit; your redirect only fires for never-visited-before traffic.

**Strip tracker hops.** Use client-side UTM parameters, not URL rewrites. `/?utm_source=x` on the canonical URL is one hop; `utm.example.com/x` → `example.com/x?utm_source=x` is two.

**Do not redirect to redirects.** When migrating a page, point the old URL at the current canonical directly — not at the intermediate URL that itself redirects. After any sitemap migration, re-run a redirect check against the full list of old URLs.

<ToolCtaLink postSlug="debug-redirect-chain" toolSlug="redirect-checker">
  Trace a domain's redirect chain →
</ToolCtaLink>

## Further reading

- [Security headers every site should have in 2026](/blog/security-headers-guide)
- Google Search Central — "How redirects affect Google Search"
```

- [ ] **Step 2–3: Register + commit**

```ts
import Redir, { frontmatter as redirFm } from "@/content/posts/debug-redirect-chain.mdx";
record("debug-redirect-chain", redirFm, Redir),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/debug-redirect-chain.mdx content/posts.ts
git commit -m "docs(blog): add redirect chain debugging post"
```

---

#### Task 14: `security-headers-guide.mdx`

**Files:**
- Create: `content/posts/security-headers-guide.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "Security headers every site should have in 2026"
date: "2026-04-30"
description: A focused tour of the HTTP response headers that protect modern web applications — HSTS, Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — with the minimum-viable value for each and the common misconfigurations to avoid.
tags: [security, http, headers, csp, hsts]
relatedTool: security-headers-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Six HTTP response headers handle 90% of the browser-enforced security surface for a modern web application. Sending them correctly is cheap; sending them wrong is subtle. Here is the 2026 baseline.

## `Strict-Transport-Security`

\`\`\`
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
\`\`\`

Tells browsers to upgrade every request to this domain (and subdomains) to HTTPS for two years. After the first hit, http-only links never reach the network — the browser rewrites them.

The `preload` directive is an opt-in to the HSTS preload list compiled into Chrome, Firefox, Safari, and Edge. Once preloaded, the upgrade applies even for never-visited-before traffic. Submit at [hstspreload.org](https://hstspreload.org). Reversal takes months, so test `includeSubDomains` carefully first.

## `Content-Security-Policy`

The hardest header to get right. A starter policy for a modern SPA:

\`\`\`
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<request-nonce>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
\`\`\`

Key principles:

- `default-src 'self'` makes everything same-origin by default. You whitelist exceptions.
- `'nonce-...'` generated per-request is the modern replacement for `'unsafe-inline'`. Every `<script>` tag echoes the same nonce.
- `frame-ancestors 'none'` is the CSP-level replacement for `X-Frame-Options: DENY`. Send both during transition; CSP wins in modern browsers.
- `report-uri` (or the newer `report-to`) sends violations as JSON to a collector. Deploy in report-only mode (`Content-Security-Policy-Report-Only`) for a week before enforcing.

## `X-Content-Type-Options`

\`\`\`
X-Content-Type-Options: nosniff
\`\`\`

Disables MIME sniffing. Without it, a browser that receives a file served as `text/plain` but starting with `<script>` may execute it as JS. The fix is one header. There is no reason not to send it.

## `Referrer-Policy`

\`\`\`
Referrer-Policy: strict-origin-when-cross-origin
\`\`\`

Default in modern Chrome/Firefox. Sends the full URL to same-origin requests, only the origin to cross-origin HTTPS requests, and nothing downgrading to HTTP. Prevents leaking private URL paths to third-party analytics, ad networks, and CDNs.

## `Permissions-Policy`

The successor to `Feature-Policy`. Gates access to powerful browser APIs:

\`\`\`
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
\`\`\`

Each empty list means "no origin, not even self, may call this API on this document." If your app genuinely needs one, allow it: `camera=(self)`. The important disables in 2026 are `browsing-topics` (Chrome's replacement for third-party cookies for ad targeting) and any of the sensor APIs you do not explicitly use.

## `X-Frame-Options`

\`\`\`
X-Frame-Options: DENY
\`\`\`

Legacy but still respected. Send it in addition to `frame-ancestors 'none'` to cover old browsers. Only drop it when analytics say your traffic is exclusively on browsers that support CSP Level 2+ (i.e. everyone in 2026).

## What to send, minimally

A single response should carry all six. Configure them in one edge function or middleware so you don't have to patch each route individually. Re-verify after any infra change that touches the response path.

<ToolCtaLink postSlug="security-headers-guide" toolSlug="security-headers-checker">
  Inspect a domain's response headers →
</ToolCtaLink>

## Further reading

- MDN — HTTP headers (security)
- [CORS preflight requests: why they fail](/blog/cors-preflight-explained)
- [TLS certificates: what to check before yours expires](/blog/tls-certificate-guide)
```

- [ ] **Step 2–3: Register + commit**

```ts
import SecHdr, { frontmatter as secHdrFm } from "@/content/posts/security-headers-guide.mdx";
record("security-headers-guide", secHdrFm, SecHdr),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/security-headers-guide.mdx content/posts.ts
git commit -m "docs(blog): add security headers guide post"
```

---

#### Task 15: `cors-preflight-explained.mdx`

**Files:**
- Create: `content/posts/cors-preflight-explained.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "CORS preflight requests: why they fail and how to fix them"
date: "2026-05-01"
description: CORS preflight is the OPTIONS request a browser sends before a "non-simple" cross-origin fetch to verify the server allows the real request. This post explains what triggers a preflight, what the server must return, and the five failure modes you will actually encounter.
tags: [cors, http, browsers, api]
relatedTool: cors-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

CORS is a browser feature. The server is a participant but not the enforcer — it only advertises permissions via headers, and the browser decides whether to let JavaScript read the response. The preflight is the browser asking "before I send the real request, will you accept it?"

## What triggers a preflight

A browser sends an `OPTIONS` preflight before a cross-origin `fetch()` or `XMLHttpRequest` when *any* of the following hold:

1. The HTTP method is anything other than `GET`, `HEAD`, or `POST`.
2. The request has a custom header — anything outside the "CORS-safelisted request headers" (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type`, `Range`).
3. The `Content-Type` is not `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`. In particular, `application/json` triggers a preflight.
4. The request body is a `ReadableStream`.

Plain `GET` to a public JSON endpoint without custom headers? No preflight — the browser sends it directly. `POST` with `Content-Type: application/json`? Preflight first.

## The preflight request

\`\`\`
OPTIONS /api/v1/things HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
\`\`\`

The browser declares: "I'm at origin X, I want to send method Y with headers Z. Will you accept?"

## The server response

\`\`\`
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: POST, GET, DELETE
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
Vary: Origin
\`\`\`

- `Access-Control-Allow-Origin` must echo the `Origin` header exactly, or be `*` (which disallows credentialed requests — see below).
- `Access-Control-Allow-Methods` lists methods the server accepts.
- `Access-Control-Allow-Headers` must include *every* header the browser asked about.
- `Access-Control-Allow-Credentials: true` is required if the real request will include cookies or an `Authorization` header. Only valid with a specific origin, never `*`.
- `Access-Control-Max-Age` caches the preflight result for N seconds so the browser doesn't preflight every single request.
- `Vary: Origin` is essential if the server varies `Allow-Origin` per origin — without it, a CDN caches the first response and serves it to every origin.

## Five failures you will actually see

**1. `Access-Control-Allow-Origin` is `*` but the request is credentialed.** The browser console reads: *"The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'."* Fix: echo the specific origin.

**2. Missing `Access-Control-Allow-Headers` entry.** You added `Authorization` to the client fetch, the server forgot to list it. The browser refuses to send the real request. Fix: add the header to the allow list.

**3. CDN caches the preflight without `Vary`.** First browser from origin A gets a response with `Allow-Origin: A`. Second browser from origin B gets the same cached response, sees `Allow-Origin: A`, fails. Fix: `Vary: Origin` on every preflight response.

**4. The origin is not the one you think.** Mobile apps, Chrome extensions, and cross-tab iframes all have origins that may not match what you whitelisted. Check the real `Origin` header before blaming the server config.

**5. Preflight returns `4xx`.** Often a misconfigured route guard (auth middleware) rejecting the `OPTIONS` before CORS middleware runs. Fix: allow `OPTIONS` through authentication-free, or move the CORS middleware earlier in the chain.

<ToolCtaLink postSlug="cors-preflight-explained" toolSlug="cors-checker">
  Run a CORS preflight against any domain →
</ToolCtaLink>

## Further reading

- [Security headers every site should have in 2026](/blog/security-headers-guide)
- MDN — CORS
- Fetch Standard — §3.2 CORS protocol
```

- [ ] **Step 2–3: Register + commit**

```ts
import Cors, { frontmatter as corsFm } from "@/content/posts/cors-preflight-explained.mdx";
record("cors-preflight-explained", corsFm, Cors),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/cors-preflight-explained.mdx content/posts.ts
git commit -m "docs(blog): add cors preflight post"
```

---

#### Task 16: `tls-certificate-guide.mdx`

**Files:**
- Create: `content/posts/tls-certificate-guide.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create the MDX file**

```mdx
---
title: "TLS certificates: what to check before yours expires"
date: "2026-05-02"
description: A certificate outage is never unlucky — it is the predictable outcome of not knowing what you have deployed. This post covers what to inspect on a live TLS certificate and the surprises that only show up in the final week.
tags: [tls, ssl, certificates, security]
relatedTool: tls-certificate-checker
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Every public TLS certificate expires. Most shops have auto-renewal — Let's Encrypt certbot, cert-manager, ACM, Cloudflare's managed certs. Auto-renewal fixes expiry; it does not catch the other ways a certificate goes wrong. The annual "oh it expired" outage is usually about something the certificate never promised in the first place.

## What a certificate actually claims

A TLS certificate is a signed statement by a certificate authority that a specific public key belongs to specific domain names, valid between two dates. The statement carries:

- **Subject common name** (legacy; browsers ignore this for name validation).
- **Subject alternative names (SANs)** — the list of domains the cert vouches for. Browsers check the SNI against this list.
- **Not Before / Not After** — validity window.
- **Signature by the issuing CA** — the intermediate certificate, which itself is signed by a root trusted by the client.
- **Public key** — what the server uses for the TLS key exchange.
- **Signature algorithm** — SHA-256 minimum; SHA-1 is rejected.

Every browser and client cares about the same fields. A cert that "works in Chrome but not in curl" almost always has a broken intermediate chain, which Chrome will fetch automatically via AIA extensions and curl will not.

## What to check on a live cert

- **Not After vs today.** Clearly. Alert at 30 days.
- **SAN list contains every domain you serve.** A common miss: cert covers `example.com` but not `www.example.com` (or vice versa). A single-name cert breaks the second your marketing team links to the other host.
- **Intermediate chain is complete.** Run `openssl s_client -connect example.com:443 -showcerts` and confirm you see at least two certs — your leaf and the intermediate. If you only see one, clients with empty intermediate caches fail. Fix: reconfigure your server to serve the full chain.
- **Algorithm: ECDSA or RSA ≥ 2048.** Smaller RSA keys still exist but are deprecated. ECDSA is preferred for smaller handshake size.
- **OCSP stapling present.** `openssl s_client -status` should return an OCSP response. Without stapling, clients make a second round-trip to the CA's OCSP server, which adds latency and leaks which sites you visit to the CA.
- **Hostname matches SNI.** If the server has many certs and picks based on SNI, a misconfigured SNI selector can serve the wrong cert for a valid hostname.

## Surprises that only appear in the final week

**Shorter validity than you expected.** CA/B Forum reduced max validity from 825 days to 398 days in 2020, and may shorten further. If your renewal cadence is annual, it is now too slow — you need automation that renews monthly.

**CAA record rejects the renewing CA.** Your DNS has `CAA 0 issue "letsencrypt.org"`, but last year someone migrated to a different CA. Renewal fails silently because the new CA can't issue. Fix: audit CAA whenever you change CAs, or leave CAA empty if you don't have a strong reason.

**Intermediate rotation.** The CA rotates their intermediate. Your server is still serving the old intermediate that's about to expire. The leaf is valid, but the chain is broken. Fix: serve the chain your CA currently publishes, not what you exported two years ago.

**Client clock skew.** A client with a wildly wrong local clock rejects valid certs because "not before" appears to be in the future. Rare but real on IoT devices and any environment without NTP.

## Renewal automation is the floor, not the ceiling

Set it up, but also monitor:
- Days until expiry (alert at 30).
- SAN coverage against actual served hostnames (alert if any served host is missing).
- OCSP stapling enabled (alert if stops responding).
- Chain validity (alert if intermediate is expiring within 14 days).

<ToolCtaLink postSlug="tls-certificate-guide" toolSlug="tls-certificate-checker">
  Inspect a domain's TLS certificate →
</ToolCtaLink>

## Further reading

- [Security headers every site should have in 2026](/blog/security-headers-guide)
- SSL Labs — "SSL and TLS Deployment Best Practices"
- Mozilla — Server Side TLS configuration generator
```

- [ ] **Step 2–3: Register + commit**

```ts
import Tls, { frontmatter as tlsFm } from "@/content/posts/tls-certificate-guide.mdx";
record("tls-certificate-guide", tlsFm, Tls),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/tls-certificate-guide.mdx content/posts.ts
git commit -m "docs(blog): add tls certificate guide post"
```

---

**Phase 2 checkpoint.** Run `pnpm test`. All unit + E2E tests green. Hit each new post URL in dev (`/blog/what-is-dmarc`, `/blog/spf-10-lookup-limit`, etc.), click each CTA, confirm it navigates to the renamed tool slug and fires a `blog_tool_click` event (visible in GA debug mode).

---

## Phase 3 — Wave 2 + 3 blog posts + MCP landings

Same pattern as the Wave 1 tasks: create MDX, register in `content/posts.ts`, run the posts unit test, commit.

### Task 17: `jwt-claims-reference.mdx`

**Files:**
- Create: `content/posts/jwt-claims-reference.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "JWT claims reference: iss, sub, aud, exp, nbf, iat explained"
date: "2026-05-03"
description: JWTs carry a set of standard claims defined by RFC 7519, plus whatever custom claims your app needs. This reference covers the standard claims, what each means at the protocol level, and the subtle differences between iat, nbf, and exp.
tags: [jwt, auth, tokens]
relatedTool: jwt
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

A JSON Web Token is three base64url-encoded segments separated by dots: header.payload.signature. The payload is a JSON object, and its keys are **claims**. RFC 7519 reserves seven short names as "registered claims"; everything else is custom. This is a reference for the standard seven.

## `iss` — issuer

The party that issued the token. Usually the URL of the authorization server: `https://auth.example.com`. Clients should validate `iss` matches the expected issuer; otherwise a token minted by a malicious but trusted-to-you server can impersonate a token from the real one.

In OAuth 2 / OIDC, the issuer's discovery document at `<iss>/.well-known/openid-configuration` tells you where to fetch the signing keys — so trusting `iss` implicitly trusts the key-discovery path too.

## `sub` — subject

The identifier for the principal the token is about, usually a user ID or service account ID. Scoped to the issuer: a `sub` of `1234` from `auth.example.com` is a different principal than `sub` of `1234` from `auth.other.com`.

Never use `sub` as a display name; it is an identifier, not a label. Never put PII in `sub` unless you own the token's entire lifecycle.

## `aud` — audience

The recipients the token is intended for. Either a string (one audience) or an array (multiple). A resource server MUST reject a token whose `aud` does not include its own identifier — the audience check is what prevents a token issued for service A from being replayed against service B.

Common bug: using the client ID as audience when you mean the resource server. The audience should be the API's canonical URL or identifier, not the calling app's.

## `exp` — expiration

Seconds since epoch at which the token becomes invalid. Required on any non-trivial token. Tokens with no `exp` live forever — they are revocable only by key rotation.

Validate with a small clock skew tolerance (commonly 30–60 seconds) to handle the case where the issuer's clock is slightly ahead of the resource server's. Beyond that, refuse.

## `nbf` — not before

Seconds since epoch before which the token is not valid. Rare in practice but useful for pre-issuing tokens that activate later (e.g. a trial that starts at a specific date). Resource servers MUST enforce it or tokens can be replayed before their activation window.

## `iat` — issued at

Seconds since epoch at which the token was issued. Not a validity boundary by itself — `iat` alone says nothing about whether the token is currently valid. Use it for audit, rate-limit-reset, or re-authentication prompts ("sensitive action: please re-enter your password, this session is older than 30 minutes").

`iat` in the future is suspicious but not necessarily invalid. Some implementations reject tokens where `iat > now + skew`.

## `jti` — JWT ID

A unique identifier for the token. Useful for:
- Replay detection (resource server keeps a bloom filter of seen `jti`s).
- Revocation lists (a specific token ID is marked invalid).

Not required. Only meaningful if the resource server actually tracks it.

## The signing + validation flow

A resource server receiving a JWT does, in order:

1. Parse the three segments.
2. Decode the header, read `alg` and `kid`.
3. Fetch the public key matching `kid` (cached from the issuer's JWKS endpoint).
4. Verify the signature using the algorithm.
5. Decode the payload.
6. Validate `iss`, `aud`, `exp`, `nbf`, `iat`.
7. Apply any application-specific checks (scopes, custom claims).

Skipping any step is a vulnerability. In particular, *not* validating `alg` is the infamous "alg=none" attack — if your library trusts the header's algorithm claim without whitelisting, an attacker submits `alg=none` and an empty signature and is trusted.

<ToolCtaLink postSlug="jwt-claims-reference" toolSlug="jwt">
  Decode a JWT and inspect its claims →
</ToolCtaLink>

## Further reading

- [How to decode a JWT without verifying it](/blog/decode-jwt-without-verifying)
- RFC 7519 — JSON Web Token
- RFC 7515 — JSON Web Signature
```

- [ ] **Step 2: Register**

```ts
import JwtClaims, { frontmatter as jwtClaimsFm } from "@/content/posts/jwt-claims-reference.mdx";
record("jwt-claims-reference", jwtClaimsFm, JwtClaims),
```

- [ ] **Step 3: Commit**

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/jwt-claims-reference.mdx content/posts.ts
git commit -m "docs(blog): add jwt claims reference post"
```

---

### Task 18: `url-encoding-guide.mdx`

**Files:**
- Create: `content/posts/url-encoding-guide.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "URL encoding: encodeURIComponent vs encodeURI (and when to use each)"
date: "2026-05-04"
description: JavaScript exposes two URL-encoding functions with overlapping but different behavior. Using the wrong one is a security bug, not a style bug. This post walks through the character sets each encodes, the exact set of exceptions, and concrete examples of when each is correct.
tags: [url, javascript, encoding]
relatedTool: url-codec
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

JavaScript ships two URL-encoding functions on the global object: `encodeURI` and `encodeURIComponent`. They do different things. Picking the wrong one is how query strings break in subtle ways and how bad URLs get bounced through middleware that happens to normalize them into worse URLs.

## The rules

`encodeURI` encodes a full URL. It assumes the input is a syntactically valid URL and it preserves the reserved characters that have structural meaning: `/`, `?`, `#`, `&`, `=`, `:`, `;`, `@`, `+`, `$`, `,`.

`encodeURIComponent` encodes a single component — a path segment, a query parameter name, or a query parameter value. It encodes the reserved characters too because a component should never contain structural URL syntax; those characters need to travel through as literal data.

In both cases the encoding is RFC 3986 percent-encoding: unsafe characters become `%XX` where `XX` is the UTF-8 byte value in hex.

## When each is correct

**Use `encodeURI`** when you have a URL string that is structurally correct (has a scheme, host, path, query) but may contain spaces or non-ASCII characters that need encoding for safe transport. Example: you got a user-typed URL from an input field and want to store or display it.

**Use `encodeURIComponent`** when you are building a URL by concatenating components, and any of those components came from untrusted input or contains characters that would otherwise conflict with URL syntax.

\`\`\`js
// Building a search URL
const query = 'hello world & goodbye';
const url = `https://example.com/search?q=${encodeURIComponent(query)}`;
// → https://example.com/search?q=hello%20world%20%26%20goodbye

// WRONG — using encodeURI lets the & through, corrupting the query
const bad = `https://example.com/search?q=${encodeURI(query)}`;
// → https://example.com/search?q=hello%20world%20&%20goodbye
// The server sees two parameters: q=hello world  and an empty parameter
\`\`\`

## What neither function does

Neither encodes `'`, `(`, `)`, `*`, or `!`, even though RFC 3986 flags them as reserved in some contexts. Some environments (email template systems, certain search engines) break on these. When you need RFC-3986-strict encoding, post-process:

\`\`\`js
function strictEncode(s) {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}
\`\`\`

Neither function decodes. Use `decodeURI` and `decodeURIComponent` as the inverses — with the same component-vs-whole-URL distinction.

Neither function handles `application/x-www-form-urlencoded` correctly by default. That format encodes spaces as `+`, not `%20`. If you are building a form body, use `URLSearchParams`:

\`\`\`js
const body = new URLSearchParams({ q: 'hello world' }).toString();
// → q=hello+world
\`\`\`

`URLSearchParams` is also the correct tool for composing query strings when you have a set of parameters. It encodes each value with the form-urlencoded variant and handles the `&` joining. Reach for `URLSearchParams` before manual concatenation with `encodeURIComponent`.

## The security angle

User input that flows into a URL component unencoded is a redirect-injection or SSRF vector. A URL like `https://api.example.com/proxy?u=<user input>` where `<user input>` is not encoded lets an attacker supply `https://evil.com&auth=stolen` and smuggle parameters into the inner URL your server constructs.

Always encode components. Never trust that an intermediate layer encoded for you.

<ToolCtaLink postSlug="url-encoding-guide" toolSlug="url-codec">
  Try encoding and decoding URL strings →
</ToolCtaLink>

## Further reading

- [Base64 isn't encryption](/blog/base64-isnt-encryption)
- RFC 3986 — URI: Generic Syntax
- MDN — `encodeURIComponent`
```

- [ ] **Step 2–3: Register + commit**

```ts
import UrlEnc, { frontmatter as urlEncFm } from "@/content/posts/url-encoding-guide.mdx";
record("url-encoding-guide", urlEncFm, UrlEnc),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/url-encoding-guide.mdx content/posts.ts
git commit -m "docs(blog): add url encoding guide post"
```

---

### Task 19: `ip-geolocation-accuracy.mdx`

**Files:**
- Create: `content/posts/ip-geolocation-accuracy.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "IP geolocation accuracy: what ASN, ISP, and org data actually tell you"
date: "2026-05-05"
description: IP geolocation is a series of inferences from public routing data. City-level accuracy is the best you should expect; rural and mobile IPs are much worse. This post walks through what ASN, ISP, and org fields actually represent and when each is trustworthy.
tags: [ip, networking, geolocation, asn]
relatedTool: ip-lookup
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

IP geolocation databases sell you a city, a region, and a country for any public IP. What they are actually selling is an informed guess, constructed from BGP announcements, WHOIS records, reverse DNS heuristics, and occasionally some crowd-sourced location pings. The quality of the guess varies enormously with the type of IP.

## What the fields mean

**ASN** (Autonomous System Number) is the most concrete field. An ASN identifies a network operator — Amazon is AS16509, Cloudflare is AS13335, Comcast has many ASes including AS7922. Every IP on the public internet belongs to exactly one ASN at a time; this mapping is public in BGP announcements and rarely wrong.

**ISP** is a human-readable name for the ASN's operator. Derived from ASN, essentially the same data in a different format.

**Org** is the organization that was delegated the specific IP block. Sometimes equals the ISP (home broadband); sometimes a tenant of the ISP (a business that leases a /24 from their telco). For cloud IPs, "org" is often the cloud provider and not the customer running on that IP.

**City, region, country** are the lookups. These come from proprietary databases (MaxMind, IP2Location, ipinfo) that merge the public routing data with WHOIS registrations, latency measurements, and whatever else they can get their hands on.

## What "accurate" means by IP type

**Cloud IPs (AWS, GCP, Azure, Cloudflare).** The city tells you which datacenter region the IP is in — usually accurate to the city level because cloud providers advertise IP ranges per region. The org tells you the cloud provider, not the customer. If you see "AWS us-east-1" that's an EC2 instance in Virginia; you have no idea whose instance it is.

**Home broadband IPs.** City-level accuracy is generally real. The ISP's WHOIS records the city where the IP block was delegated, and most ISPs stick to that geographically. Subscriber-level accuracy (street address) is fiction — that data is not public.

**Mobile carrier IPs.** Wildly inaccurate. A single IP may carry traffic from anywhere in the country (or continent) because the carrier NATs millions of subscribers behind a handful of gateways. "Accurate to country" is the best you should expect.

**VPN and proxy IPs.** Whatever the VPN exit node's location is — which is not where the user is. Commercial VPNs sell "exit nodes in 50 countries"; each node's geolocation is roughly correct for itself and meaningless for the user.

**Anycast IPs (CDN, DNS resolvers).** Meaningless. `1.1.1.1` is announced from dozens of physical locations; the "location" returned depends on the database's choice of which announcement to privilege.

## When to trust geolocation

Three legitimate uses:

1. **Routing.** Serve a closer CDN edge, show a locally-relevant homepage, default to a likely currency. Getting it wrong is mildly annoying, never critical.
2. **Fraud signals.** A credit-card transaction from a city that doesn't match the billing address is one signal among many. Not a decision, a factor.
3. **Aggregate analytics.** "15% of our visitors are from France" is accurate even though the location of any specific visitor is noisy.

## When not to trust it

- Compliance decisions (geo-fencing, age-of-consent gating). Too many false positives from VPNs and mobile IPs.
- Security alerts on a per-IP basis. A user travels; their home router gets a new CGNAT; a family member opens a VPN. All cause spurious "login from unusual location" noise.
- Anything advertised as "pinpointing user location." No public IP database does this reliably.

## ASN is usually more useful than city

For most of the analytical questions people ask of IP data, ASN answers better than city does. "Is this user on a residential connection or a cloud IP?" is the question behind most "is this a bot?" checks — and ASN tells you.

<ToolCtaLink postSlug="ip-geolocation-accuracy" toolSlug="ip-lookup">
  Look up an IP's ASN, ISP, and location →
</ToolCtaLink>

## Further reading

- [Reading IP from Vercel edge headers](/blog/reading-ip-from-vercel-edge-headers)
- MaxMind — GeoIP2 accuracy methodology
- RFC 7020 — Internet Numbers Registry System
```

- [ ] **Step 2–3: Register + commit**

```ts
import IpGeo, { frontmatter as ipGeoFm } from "@/content/posts/ip-geolocation-accuracy.mdx";
record("ip-geolocation-accuracy", ipGeoFm, IpGeo),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/ip-geolocation-accuracy.mdx content/posts.ts
git commit -m "docs(blog): add ip geolocation accuracy post"
```

---

### Task 20: `json-formatting-for-logs.mdx`

**Files:**
- Create: `content/posts/json-formatting-for-logs.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "JSON formatting for logs: pretty-print vs minified and why it matters"
date: "2026-05-06"
description: Structured logs live in two worlds — the ingestion pipeline that wants compact machine-readable lines and the engineer who wants to read them during an incident. This post explains when to use each format and how to have both without breaking your log shipper.
tags: [json, logging, observability]
relatedTool: json
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

The two useful forms of JSON for logs — pretty-printed and minified — optimize for opposite consumers. Pretty-printed is for humans reading with their eyes. Minified (the default, one-line-per-record) is for log shippers reading with regex. Choose wrong and you either flood the pipeline with multi-line records or ship logs that nobody can debug on a call.

## The split

**Minified** JSON is one `{"key":"value",...}` per line. It is what every structured-log framework outputs by default: `logrus.JSONFormatter`, `pino`, `zerolog`, `winston` with the JSON formatter, Python's `structlog` with the JSON processor.

**Pretty-printed** JSON has indentation and line breaks:

\`\`\`json
{
  "timestamp": "2026-05-06T12:34:56Z",
  "level": "error",
  "msg": "db connection failed",
  "host": "web-3",
  "error": {
    "type": "ConnectionRefused",
    "attempt": 3
  }
}
\`\`\`

The minified version of the same:

\`\`\`
{"timestamp":"2026-05-06T12:34:56Z","level":"error","msg":"db connection failed","host":"web-3","error":{"type":"ConnectionRefused","attempt":3}}
\`\`\`

Identical data. Wildly different readability. Wildly different ingestion characteristics.

## Why log shippers need minified

Most log shippers assume **one record per line**. `tail -F`, `fluentbit`, `vector`, Datadog's agent, Splunk's universal forwarder — they all read line by line and treat each line as a discrete record. Pretty-printed JSON's internal newlines break that assumption. A single log event becomes 15 records, each a fragment, and downstream parsing fails.

Some shippers support multiline patterns (matching on an indent or a bracket). These work but are brittle: a timestamp format change, an extra nested field, and the pattern stops matching. Production logs should always be minified.

## Why humans need pretty-printed

Reading a 400-character minified line is possible but slow. During an incident you are scanning 50 log lines looking for one pattern; each line is a 3-second visual parse in minified form, 1 second pretty-printed. That difference compounds fast.

## How to have both

Two approaches:

**Tooling at the read-side.** Pipe minified logs through `jq` on your terminal:

\`\`\`
kubectl logs pod-name | jq '.'
\`\`\`

`jq .` pretty-prints every record. `jq -c '.'` compacts them back. Combined with filters (`jq 'select(.level == "error")'`) you get structured grep + pretty output with one command.

**Pretty for CI, minified for prod.** Many frameworks have dev vs prod modes: pretty-print (and color) when running locally or in CI, minified in production. Do this via a config flag, not a build-time constant — being able to flip it in an incident is valuable.

## Formatting choices that matter

**Key ordering.** Minified JSON has no intrinsic order; pretty-printed output usually preserves insertion order (JSON is defined as unordered, but every JSON library in practice preserves insertion order). If you are diffing logs, ordering matters. Standardize on alphabetical when you need diffability.

**Indent width.** Two spaces is the most readable for typical log records. Four spaces wastes screen real estate; tabs render inconsistently across terminals.

**Trailing newline.** Every log record should end with `\n`. Without it, the next record's first character appears glued to the previous record's last character, which breaks every line-based parser downstream.

<ToolCtaLink postSlug="json-formatting-for-logs" toolSlug="json">
  Format or minify a JSON payload →
</ToolCtaLink>

## Further reading

- [Base64 isn't encryption](/blog/base64-isnt-encryption)
- RFC 8259 — JSON Data Interchange Format
```

- [ ] **Step 2–3: Register + commit**

```ts
import JsonLogs, { frontmatter as jsonLogsFm } from "@/content/posts/json-formatting-for-logs.mdx";
record("json-formatting-for-logs", jsonLogsFm, JsonLogs),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/json-formatting-for-logs.mdx content/posts.ts
git commit -m "docs(blog): add json formatting for logs post"
```

---

### Task 21: `check-domain-dns-from-claude.mdx`

**Files:**
- Create: `content/posts/check-domain-dns-from-claude.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "How to check any domain's DNS and email setup directly from Claude"
date: "2026-05-07"
description: Claude Desktop supports remote MCP servers, which means any tool a server advertises becomes a first-class capability inside your chat. drwho.me's MCP endpoint ships ten domain-dossier checks; here is how to wire it up.
tags: [mcp, claude, ai, dns]
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Model Context Protocol is Anthropic's standard for letting LLMs call external tools. Once configured, Claude Desktop treats an MCP server's tools the same as its built-in capabilities — you ask "what's the DMARC record for stripe.com?" and Claude invokes `dossier_dmarc` directly, parses the response, and writes up the answer.

## What drwho.me exposes

The MCP endpoint at `https://drwho.me/mcp/mcp` advertises 21 tools:

- 10 per-check dossier functions: `dossier_dns`, `dossier_mx`, `dossier_spf`, `dossier_dmarc`, `dossier_dkim`, `dossier_tls`, `dossier_redirects`, `dossier_headers`, `dossier_cors`, `dossier_web_surface`.
- `dossier_full` — runs all ten checks in parallel and returns one JSON object. One tool call, ten checks.
- 10 developer utilities: `base64_encode`, `base64_decode`, `dns_lookup`, `jwt_decode`, `uuid_generate`, `url_encode`, `url_decode`, `json_format`, `user_agent_parse`, `ip_lookup`.

Same results as the web UI. Same cache. Same rate limits.

## Adding the server to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the platform equivalent:

\`\`\`json
{
  "mcpServers": {
    "drwho.me": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://drwho.me/mcp/mcp"]
    }
  }
}
\`\`\`

Claude Desktop only accepts stdio-style entries, so `mcp-remote` runs as a local proxy to the remote endpoint. Restart Claude Desktop after editing. The next conversation will see the tools.

## What the conversation looks like

You ask: "Check whether stripe.com has a DMARC record and what policy it publishes."

Claude calls `dossier_dmarc(stripe.com)`, receives a JSON result with the record text, policy, and reporting address, then writes a human-readable summary. You never see the raw tool call unless you expand the tool-use block.

Multi-domain questions work too: "Compare the TLS cert expiry dates for stripe.com, paypal.com, and chase.com." Claude issues three `dossier_tls` calls in parallel, collates the results, and presents a table.

## When to use MCP vs the web UI

MCP wins for:
- Workflow integration — you are already in a chat discussing a system, and pulling up a browser breaks context.
- Aggregation — asking for a report across 20 domains is faster than clicking 20 pages.
- Composition — combining dossier output with Claude's knowledge ("this DMARC policy is misconfigured because X, which is why you are seeing Y in the aggregate reports").

The web UI wins for:
- Shareable links — you want to send a co-worker the report.
- Browser-native UX — sticky sections, copy buttons, and the fixed terminal styling.

<ToolCtaLink postSlug="check-domain-dns-from-claude" toolSlug="dns-records-lookup">
  Or check DNS records in the browser →
</ToolCtaLink>

## Further reading

- [Set up the drwho.me MCP server in Claude Desktop](/mcp/claude)
- Model Context Protocol — official spec
```

- [ ] **Step 2–3: Register + commit**

Note: no `relatedTool` in frontmatter — this post talks about the MCP endpoint generally, not a single tool. (The `relatedTool` field is optional; `lib/blog.ts`'s `parseFrontmatter` treats it as optional.)

```ts
import McpClaude, { frontmatter as mcpClaudeFm } from "@/content/posts/check-domain-dns-from-claude.mdx";
record("check-domain-dns-from-claude", mcpClaudeFm, McpClaude),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/check-domain-dns-from-claude.mdx content/posts.ts
git commit -m "docs(blog): add check-domain-dns-from-claude post"
```

---

### Task 22: `mcp-network-tools-workflow.mdx`

**Files:**
- Create: `content/posts/mcp-network-tools-workflow.mdx`
- Modify: `content/posts.ts`

- [ ] **Step 1: Create MDX**

```mdx
---
title: "Using MCP servers for network diagnostics in your AI workflow"
date: "2026-05-08"
description: The current generation of AI assistants can hold the context, reason about failure modes, and call tools in parallel — three things that turn network diagnostics from a twenty-tab browser session into a five-line chat thread. Here is a concrete workflow.
tags: [mcp, ai, workflow, networking]
---

import { ToolCtaLink } from "@/components/blog/ToolCtaLink";

Network diagnostics is a category of work where the value is not in running a single check — it is in running the right sequence of checks based on what the last one returned. That loop is exactly what an LLM with tool-use is good at. Setting up MCP network tools once and then using them inside conversations is a real productivity shift.

## What changes when MCP enters the loop

The traditional flow for "something is wrong with email delivery for example.com":

1. Check the MX record in terminal A.
2. Resolve the SPF record in terminal B.
3. Paste the SPF into an SPF validator in browser tab C.
4. Check the DKIM selector in tab D.
5. Check the DMARC record.
6. Read three different documentation pages to remember what each field means.
7. Aggregate a conclusion.

Twenty-odd browser tabs and several terminals. Maybe fifteen minutes for someone who has done this before; an hour for someone who has not.

With MCP configured, the same flow:

1. Paste the domain into chat, ask "run the email auth stack on example.com and tell me what's wrong."
2. Read the single-paragraph summary the model produces.

The model calls `dossier_mx`, `dossier_spf`, `dossier_dmarc`, `dossier_dkim` in parallel (MCP tool calls are concurrent), collates the four JSON responses, and summarises.

## Concrete workflows

**Pre-launch domain audit.** Before pointing a new domain at production: "Run a full dossier on newdomain.example and tell me which checks would block me from sending email, what my TLS setup looks like, and whether the security headers are acceptable." One tool call (`dossier_full`), one reply.

**Cross-domain comparison.** "Compare the response headers and TLS expiry on our domain and two of our competitors." Three parallel tool calls, a table comparing them.

**Change verification.** "I just updated the DMARC policy from none to quarantine. Confirm the new record is live." Single tool call, plus the model reads the response and confirms the `p=` value matches expectations.

**On-call triage.** "Why is mail from our domain getting rejected by gmail?" The model runs the email-auth checks, reads the SPF lookup count, spots that it is over 10, and reports `permerror` as the likely cause.

## Practical tips

**Keep the prompt specific.** "Run a dossier on X" is clearer than "debug our email for X." The model will do more of the right thing when the scope is explicit.

**Ask for the JSON.** If you are building on top of the output, end your prompt with "return the raw dossier JSON." The model will include a code block of the tool response alongside its summary.

**Use `dossier_full` for parallel runs.** The aggregate tool runs all ten checks concurrently server-side and counts as one tool call. Asking the model to call each tool individually works but takes longer and runs through more context.

**Cache is shared with the web UI.** If you already loaded `/d/example.com` in the browser, the MCP call hits the same cache and returns instantly.

<ToolCtaLink postSlug="mcp-network-tools-workflow" toolSlug="dns-records-lookup">
  Try the browser version of the dossier →
</ToolCtaLink>

## Further reading

- [How to check any domain's DNS and email setup from Claude](/blog/check-domain-dns-from-claude)
- [Set up the drwho.me MCP server in Claude Desktop](/mcp/claude)
```

- [ ] **Step 2–3: Register + commit**

```ts
import McpFlow, { frontmatter as mcpFlowFm } from "@/content/posts/mcp-network-tools-workflow.mdx";
record("mcp-network-tools-workflow", mcpFlowFm, McpFlow),
```

```bash
pnpm vitest run tests/unit/content/posts.test.ts
git add content/posts/mcp-network-tools-workflow.mdx content/posts.ts
git commit -m "docs(blog): add mcp network tools workflow post"
```

---

### Task 23: `McpConfigBlock` shared component + `/mcp/claude` landing

The three MCP client landings share ~80% of their content. Extract the config + tool-list into a shared component first, then compose each landing from that component + client-specific copy.

**Files:**
- Create: `components/mcp/McpConfigBlock.tsx`
- Create: `components/mcp/McpInstallButton.tsx`
- Create: `tests/unit/components/mcp/McpInstallButton.test.tsx`
- Create: `app/mcp/claude/page.tsx`
- Create: `tests/unit/app/mcp/claude/page.test.tsx`

- [ ] **Step 1: Write failing test for `McpInstallButton`**

Create `tests/unit/components/mcp/McpInstallButton.test.tsx`:

```tsx
import { McpInstallButton } from "@/components/mcp/McpInstallButton";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  window.gtag = undefined;
});

describe("McpInstallButton", () => {
  it("copies config to clipboard and fires mcp_install_click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<McpInstallButton client="claude" config={"{foo:1}"} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith("{foo:1}");
    expect(gtag).toHaveBeenCalledWith("event", "mcp_install_click", {
      client: "claude",
    });
  });
});
```

- [ ] **Step 2: Implement `McpInstallButton`**

Create `components/mcp/McpInstallButton.tsx`:

```tsx
"use client";

import { trackMcpInstallClick } from "@/lib/analytics/client";
import { useState } from "react";

type Props = {
  client: string;
  config: string;
};

export function McpInstallButton({ client, config }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(config);
      trackMcpInstallClick(client);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // swallow: insecure context
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm border px-3 py-1 hover:border-accent"
    >
      {copied ? "copied" : "copy config"}
    </button>
  );
}
```

- [ ] **Step 3: Implement `McpConfigBlock`**

Create `components/mcp/McpConfigBlock.tsx`:

```tsx
import { McpInstallButton } from "@/components/mcp/McpInstallButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { findTool } from "@/content/tools";
import { mcpTools } from "@/lib/mcp/tools";
import type { Route } from "next";
import Link from "next/link";

type Props = {
  client: string;
  configPath: string;
  config: string;
  footnote?: string;
};

export function McpConfigBlock({ client, configPath, config, footnote }: Props) {
  return (
    <>
      <section className="space-y-2">
        <h2 className="text-sm text-muted">config</h2>
        <TerminalCard label={`$ ${configPath}`}>
          <pre className="text-xs whitespace-pre overflow-x-auto">{config}</pre>
        </TerminalCard>
        <div className="flex items-center gap-3">
          <McpInstallButton client={client} config={config} />
          {footnote && <p className="text-xs text-muted">{footnote}</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">tools advertised ({mcpTools.length})</h2>
        <ul className="text-sm space-y-1 list-none p-0">
          {mcpTools.map((t) => {
            const web = findTool(t.slug);
            return (
              <li key={t.name} className="border-b last:border-b-0 py-2">
                <code className="text-accent">{t.name}</code> — {t.description}
                {web && (
                  <>
                    {" "}
                    <Link href={`/tools/${web.slug}` as Route} className="text-muted">
                      (try in browser)
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Write failing test for `/mcp/claude`**

Create `tests/unit/app/mcp/claude/page.test.tsx`:

```tsx
import ClaudeMcp from "@/app/mcp/claude/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/claude", () => {
  it("renders the Claude install heading", () => {
    render(<ClaudeMcp />);
    expect(screen.getByText(/claude desktop/i)).toBeDefined();
  });

  it("shows the mcp-remote config snippet", () => {
    render(<ClaudeMcp />);
    expect(screen.getByText(/mcp-remote/i)).toBeDefined();
  });
});
```

- [ ] **Step 5: Implement `app/mcp/claude/page.tsx`**

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { McpConfigBlock } from "@/components/mcp/McpConfigBlock";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";

const MCP_URL = "https://drwho.me/mcp/mcp";

const config = JSON.stringify(
  {
    mcpServers: {
      "drwho.me": {
        command: "npx",
        args: ["-y", "mcp-remote", MCP_URL],
      },
    },
  },
  null,
  2,
);

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on claude desktop — install mcp server",
  description:
    "add drwho.me's remote mcp server to claude desktop. 21 tools: 10 domain-dossier checks, 10 developer utilities, one aggregate. copy the config, restart claude.",
  path: "/mcp/claude",
  type: "page",
});

export default function ClaudeMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for Claude Desktop",
    description: "Install drwho.me's remote MCP server in Claude Desktop.",
    url: `${siteUrl()}/mcp/claude`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/claude" />
      <TerminalPrompt>mcp / claude desktop</TerminalPrompt>

      <p className="text-sm">
        add the drwho.me mcp server to claude desktop and claude can call every
        dossier check and developer utility directly from a conversation.
      </p>

      <McpConfigBlock
        client="claude"
        configPath="~/Library/Application Support/Claude/claude_desktop_config.json"
        config={config}
        footnote="macOS path; adjust for Linux/Windows. Restart Claude Desktop after saving. npx mcp-remote bridges the desktop stdio client to the remote http endpoint."
      />

      <section className="space-y-2">
        <h2 className="text-sm text-muted">example prompts</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>&ldquo;what&apos;s the dmarc record for stripe.com?&rdquo;</li>
          <li>&ldquo;run a full dossier on my new domain example.com.&rdquo;</li>
          <li>&ldquo;compare tls cert expiry for github.com, gitlab.com, and bitbucket.org.&rdquo;</li>
        </ul>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run tests/unit/components/mcp/ tests/unit/app/mcp/claude/`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add components/mcp/ app/mcp/claude/ tests/unit/components/mcp/ tests/unit/app/mcp/claude/
git commit -m "feat(mcp): add /mcp/claude landing and shared config components"
```

---

### Task 24: `/mcp/cursor` landing

**Files:**
- Create: `app/mcp/cursor/page.tsx`
- Create: `tests/unit/app/mcp/cursor/page.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/app/mcp/cursor/page.test.tsx`:

```tsx
import CursorMcp from "@/app/mcp/cursor/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/cursor", () => {
  it("references the cursor config path", () => {
    render(<CursorMcp />);
    expect(screen.getByText(/\.cursor\/mcp\.json/)).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement the page**

Create `app/mcp/cursor/page.tsx`:

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { McpConfigBlock } from "@/components/mcp/McpConfigBlock";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";

const MCP_URL = "https://drwho.me/mcp/mcp";

const config = JSON.stringify(
  {
    mcpServers: {
      "drwho.me": {
        url: MCP_URL,
      },
    },
  },
  null,
  2,
);

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on cursor — install mcp server",
  description:
    "add drwho.me's remote mcp server to cursor. 21 network + developer tools available inline in your editor chat.",
  path: "/mcp/cursor",
  type: "page",
});

export default function CursorMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for Cursor",
    description: "Install drwho.me's remote MCP server in Cursor.",
    url: `${siteUrl()}/mcp/cursor`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/cursor" />
      <TerminalPrompt>mcp / cursor</TerminalPrompt>

      <p className="text-sm">
        cursor supports streamable-http mcp servers natively, so no local bridge
        is needed — point it at the url and restart.
      </p>

      <McpConfigBlock
        client="cursor"
        configPath="~/.cursor/mcp.json"
        config={config}
        footnote="Cursor hot-reloads mcp.json changes on most platforms. If the tools don't appear, restart Cursor. Project-scoped configs can also live at .cursor/mcp.json inside the workspace root."
      />

      <section className="space-y-2">
        <h2 className="text-sm text-muted">example prompts</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>&ldquo;check the dns for the domain in this config file.&rdquo;</li>
          <li>&ldquo;decode the base64 string on line 42 of this file.&rdquo;</li>
          <li>&ldquo;what&apos;s the security-headers posture of the url in my env var?&rdquo;</li>
        </ul>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm vitest run tests/unit/app/mcp/cursor/page.test.tsx
git add app/mcp/cursor/ tests/unit/app/mcp/cursor/
git commit -m "feat(mcp): add /mcp/cursor landing"
```

---

### Task 25: `/mcp/openai` landing

**Files:**
- Create: `app/mcp/openai/page.tsx`
- Create: `tests/unit/app/mcp/openai/page.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/app/mcp/openai/page.test.tsx`:

```tsx
import OpenaiMcp from "@/app/mcp/openai/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("/mcp/openai", () => {
  it("mentions custom GPT actions", () => {
    render(<OpenaiMcp />);
    expect(screen.getByText(/custom gpt/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement the page**

Create `app/mcp/openai/page.tsx`:

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

const MCP_URL = "https://drwho.me/mcp/mcp";

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on openai / chatgpt — mcp and custom gpts",
  description:
    "use drwho.me's tools from chatgpt via mcp connectors or as a custom gpt action. 21 network and developer tools over streamable http.",
  path: "/mcp/openai",
  type: "page",
});

export default function OpenaiMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for OpenAI / ChatGPT",
    description: "Use drwho.me's MCP endpoint from ChatGPT via MCP connectors or a Custom GPT.",
    url: `${siteUrl()}/mcp/openai`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/openai" />
      <TerminalPrompt>mcp / openai + chatgpt</TerminalPrompt>

      <p className="text-sm">
        chatgpt supports mcp connectors natively for business and enterprise
        accounts; for free / plus accounts, wrap the endpoint as a custom gpt
        action.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">option 1: mcp connector (business / enterprise)</h2>
        <p className="text-sm">
          settings → connectors → add → &ldquo;custom mcp server&rdquo; → point
          at the url below. mcp connectors on chatgpt require streamable-http,
          which drwho.me speaks natively.
        </p>
        <TerminalCard label="$ mcp url">{MCP_URL}</TerminalCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">option 2: custom gpt action</h2>
        <p className="text-sm">
          custom gpts accept openapi 3.1 action definitions. wrap drwho.me&apos;s
          mcp endpoint with a minimal relay (any function-as-a-service works) that
          exposes each tool as an http post action, or use one of the
          mcp-to-openapi proxies available on github.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">tools advertised</h2>
        <p className="text-sm">
          see the{" "}
          <Link href={"/mcp" as Route}>mcp landing page</Link>
          {" "}for the full list of 21 tools. all of them are callable from both
          flows above.
        </p>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm vitest run tests/unit/app/mcp/openai/page.test.tsx
git add app/mcp/openai/ tests/unit/app/mcp/openai/
git commit -m "feat(mcp): add /mcp/openai landing"
```

---

### Task 26: MCP directory submission checklist

**Files:**
- Create: `docs/notes/mcp-directories.md`

- [ ] **Step 1: Create the checklist**

Create `docs/notes/mcp-directories.md`:

```markdown
# MCP directory submissions

Checklist of third-party directories that list MCP servers. Submit and keep updated when the server's capabilities or description change.

## Status legend
- ✅ live and current
- 🟡 submitted, pending approval
- 🔴 not submitted

## Directories

### PulseMCP
- URL: https://www.pulsemcp.com
- Status: 🟡 listed — re-verify description after each capability change
- Listing points to `/mcp` landing; update when new `/mcp/<client>` sub-pages go live
- Tool count shown: 21 (10 dossier + 10 utility + 1 aggregate)

### mcp.so
- URL: https://mcp.so
- Status: 🔴
- Submit via: https://mcp.so/submit
- Required fields: name, url, description (≤280 chars), github url
- Description to use: "Remote MCP server at drwho.me — 10 domain-dossier checks (dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, web-surface), 10 developer utilities (base64, jwt, dns-lookup, uuid, url codec, json, ua, ip-lookup), and an aggregate dossier_full tool. Streamable HTTP."

### Glama.ai
- URL: https://glama.ai/mcp/servers
- Status: 🟡 submitted as "drwhome" 2026-04-24 — pending review
- Name field rejects dots / URLs; used "drwhome"
- Once approved: add Glama badge to awesome-mcp-servers PR #5017 at
  `https://glama.ai/mcp/servers/hikmahtech/drwhome/badges/score.svg`

### cursor.directory
- URL: https://cursor.directory (MCP section)
- Status: 🔴
- Submit via their github repo pull request
- Include the `/mcp/cursor` install URL as the primary install path

### awesome-mcp-servers
- URL: https://github.com/punkpeye/awesome-mcp-servers
- Status: 🟡 PR #5017 open — rebased 2026-04-24, waiting on Glama badge
- Format per repo conventions; see PR for current wording

### Emerging / post-launch
Track new directories as they appear. Reasonable sources: HN mcp announcement posts, mcp subreddit, mcp.run directory mirrors.

## Re-submission triggers

Update every directory when any of the following change:
- Tool count (add/remove a tool in `lib/mcp/tools.ts`)
- Primary endpoint URL
- Transport (currently Streamable HTTP)
- Paid-tier policy (currently: handshake + tools/list open; tools/call returns 402)
- Company or project ownership
```

- [ ] **Step 2: Commit**

```bash
git add docs/notes/mcp-directories.md
git commit -m "docs(mcp): add directory submission checklist"
```

---

**Phase 3 checkpoint.** `pnpm test` green. Deploy to Vercel, verify:
- OG image renders in Slack / X / LinkedIn link unfurl for a share of `/d/stripe.com`.
- `/tools`, `/domain-dossier`, `/mcp/claude`, `/mcp/cursor`, `/mcp/openai` show up in sitemap.xml.
- Each blog post's CTA link hits the renamed tool slug and shows the right page.
- Analytics events fire correctly in GA debug mode.
- Redirect `/tools/dossier-dmarc` → `/tools/dmarc-checker` returns 308.
- Lighthouse CI still passes at perf/SEO ≥ 95 on `/d/example.com` and the other gated URLs.

---

## Post-launch manual tasks (not covered by this plan)

- Submit new MCP directory listings from `docs/notes/mcp-directories.md`.
- Manually request Google re-indexing for `/tools`, `/domain-dossier`, and the 14 new blog posts via Search Console.
- Monitor GA for the new events: `dossier_viewed`, `dossier_shared`, `mcp_install_click`, `blog_tool_click`.
- Track DMARC aggregate report volume — if a post goes viral (spikes in share events), anticipate increased dossier traffic and consider raising the per-IP rate limit.

