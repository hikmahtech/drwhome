# drwho.me — Design Spec

**Date**: 2026-04-16
**Status**: Draft, awaiting user approval
**Repository**: `git@github.com:hikmahtech/drwho.git` (to be created under `hikmahtech` org)
**Domain**: `drwho.me` (purchased via GoDaddy, DNS → Vercel)

## 1. Goal

Ship a fast, minimal, monetized web tools site at `drwho.me` combining network/IP lookups with developer utilities. Optimized for SEO (organic search is the main traffic source) and monetized via Google AdSense + contextual affiliate links. A paid remote **MCP** endpoint reserves the namespace and lists tools for AI assistants (Claude, ChatGPT) while returning a paywalled `402` for actual calls until the paid tier is built.

Target audience: technical users and AI-assisted devs searching for quick lookup / codec / format tools.

## 2. Scope

### v1 tool list (10)

**Network (4 web + 2 web-only)**

| Slug | Name | Data source | MCP? |
|---|---|---|---|
| `ip` | What is my IP | Vercel edge headers | ❌ (browser-only meaning) |
| `ip-lookup` | IP lookup | ipinfo.io (free tier, 50k/mo) | ✅ `ip_lookup` |
| `user-agent` | User agent parser | `ua-parser-js` (client) | ✅ `user_agent_parse` |
| `headers` | HTTP headers inspector | request headers | ❌ (browser-only meaning) |
| `dns` | DNS lookup | Cloudflare DoH (free, no key) | ✅ `dns_lookup` |

**Dev utilities (5, all client-side, all MCP)**

| Slug | Name | MCP tool name |
|---|---|---|
| `json` | JSON formatter / validator | `json_format` |
| `base64` | Base64 encode/decode | `base64_encode`, `base64_decode` |
| `url-codec` | URL encode/decode | `url_encode`, `url_decode` |
| `jwt` | JWT decoder (client-side only) | `jwt_decode` |
| `uuid` | UUID generator (v4, v7) | `uuid_generate` |

### v2 backlog (deferred — do not implement)

- **Tools**: WHOIS lookup, port checker, ping/traceroute, timestamp converter, hash tools (MD5/SHA-1/SHA-256), regex tester, password generator, markdown → HTML, JSON ↔ YAML, cron parser, color converter.
- **MCP paid tier**: Stripe subscription, API key issuance + validation middleware, per-call metering, dashboards. Swap `lib/mcp/paywall.ts` from stub (`402 Payment Required`) to real billing.
- **Monetization**: Ezoic / Media.net A/B test layered on AdSense (after 3 months of traffic data).
- **Content**: continuous blog cadence, target ~20 indexed posts within 6 months.
- **PWA**: manifest + service worker so dev utilities work offline.
- **i18n**: (only if organic data shows non-English demand).

### Explicit non-goals

- No user accounts, no auth, no DB on the web side.
- No backend state beyond edge-cached responses + an MCP waitlist list in Vercel KV.
- No Ezoic / Media.net at launch (AdSense only).
- No mobile native app.
- No API keys or rate-limited-by-user calls at launch.

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Best-in-class SEO, server components, Vercel-native |
| Language | TypeScript (strict) | Type safety; MCP SDK is typed |
| Styling | Tailwind v4 | Speed, consistency, no CSS bloat |
| UI primitives | Hand-rolled (no shadcn at v1) | 7 components total, keep surface tight |
| Font | JetBrains Mono via `next/font/google` | Terminal aesthetic, self-hosted at build, no FOUT |
| Content | MDX (blog, legal pages) | Markdown + React where needed |
| Package mgr | pnpm | Per user's preferences |
| Lint/format | Biome | Single tool, fast |
| Tests | Vitest + React Testing Library + Playwright | Standard, low-friction |
| CI | GitHub Actions | Lint, typecheck, test, Lighthouse |
| Hosting | Vercel | Edge headers for IP detection, edge caching, first-class Next.js |
| Analytics | Vercel Analytics | Cookieless, Web Vitals built-in |
| Email (contact/waitlist) | Resend via server action | Simple, free tier sufficient |
| MCP server | `@vercel/mcp-adapter` on Vercel | Official support, Streamable HTTP transport |

### Environment variables

Set in Vercel dashboard (never committed):

- `IPINFO_TOKEN` — ipinfo.io free-tier token (server-only)
- `RESEND_API_KEY` — for contact + waitlist forms (server-only)
- `ADSENSE_CLIENT_ID` — added post-approval
- `NEXT_PUBLIC_SITE_URL` — `https://drwho.me` (used for canonical URLs)

## 4. Architecture

### 4.1 Boundary split (3 concerns)

1. **Tool registry** (`content/tools.ts`) — single typed array of tool metadata. Home grid, sitemap, nav dropdown, per-tool SEO, MCP server registration all read from this list. Adding a v2 tool is one entry in this file.

2. **Tool logic** (`lib/tools/*.ts`) — pure TypeScript functions, one file per tool. **No React, no Next.js, no DOM.** Used by:
   - React components in `components/tools/*` (web UI)
   - MCP tool handlers in `lib/mcp/server.ts` (AI clients)
   This dual-consumer constraint forces clean interfaces and prevents logic drift.

3. **Layout chrome** (`components/layout/*`, `components/terminal/*`) — shared nav, footer, theme toggle, `TerminalCard`, `CopyButton`, `AdSlot`, `AffiliateCard`.

### 4.2 File tree

```
drwho/
├── app/
│   ├── layout.tsx                 # theme provider, nav, footer, analytics
│   ├── page.tsx                   # home: hero + tool grid
│   ├── globals.css                # Tailwind + CSS vars for theme tokens
│   ├── tools/[slug]/page.tsx      # single dynamic route for all tools
│   ├── blog/
│   │   ├── page.tsx               # post list
│   │   └── [slug]/page.tsx        # MDX post renderer
│   ├── mcp/
│   │   ├── route.ts               # Streamable HTTP MCP endpoint
│   │   └── page.tsx               # public landing + waitlist form
│   ├── about/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── contact/page.tsx
│   ├── sitemap.ts                 # generated from registry + MDX frontmatter
│   ├── robots.ts
│   ├── opengraph-image.tsx        # default OG
│   └── api/
│       ├── whoami/route.ts        # returns edge-header IP info
│       ├── ip-lookup/route.ts     # proxies ipinfo.io
│       └── dns/route.ts           # proxies Cloudflare DoH
├── components/
│   ├── tools/
│   │   ├── WhatIsMyIp.tsx
│   │   ├── IpLookup.tsx
│   │   ├── UserAgent.tsx
│   │   ├── Headers.tsx
│   │   ├── Dns.tsx
│   │   ├── Json.tsx
│   │   ├── Base64.tsx
│   │   ├── UrlCodec.tsx
│   │   ├── Jwt.tsx
│   │   └── Uuid.tsx
│   ├── terminal/
│   │   ├── TerminalCard.tsx
│   │   ├── TerminalPrompt.tsx
│   │   ├── CopyButton.tsx
│   │   └── ThemeToggle.tsx
│   ├── layout/
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   └── Breadcrumb.tsx
│   ├── AdSlot.tsx
│   ├── AffiliateCard.tsx
│   └── ToolCard.tsx
├── content/
│   ├── tools.ts                   # ← registry
│   ├── affiliates.ts              # per-tool affiliate config
│   └── blog/
│       ├── what-is-an-ip-address.mdx
│       ├── understanding-asns.mdx
│       ├── dns-record-types-explained.mdx
│       ├── jwt-structure.mdx
│       └── base64-explained.mdx
├── lib/
│   ├── tools/                     # ← pure logic, reused by web + MCP
│   │   ├── ipLookup.ts
│   │   ├── dns.ts
│   │   ├── jsonFormat.ts
│   │   ├── base64.ts
│   │   ├── url.ts
│   │   ├── jwt.ts
│   │   ├── uuid.ts
│   │   └── userAgent.ts
│   ├── mcp/
│   │   ├── server.ts              # tool registration
│   │   └── paywall.ts             # 402 middleware (stub, swap later)
│   ├── seo.ts                     # metadata helpers
│   ├── theme.ts                   # theme detection + persist
│   └── constants.ts
├── public/
│   ├── favicon.ico
│   └── robots.txt                 # fallback; real one is app/robots.ts
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-16-drwho-me-design.md   # this file
├── tests/
│   ├── unit/lib/tools/*.test.ts
│   └── e2e/smoke.spec.ts
├── .github/workflows/ci.yml
├── biome.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── README.md
└── CLAUDE.md                      # project-specific instructions
```

### 4.3 Key architectural choices

- **Single dynamic tool route** `app/tools/[slug]/page.tsx`. All tool pages share one route; it looks up the registry by slug and renders the matching component. Per-tool metadata, breadcrumb, ad placement, and JSON-LD all live in this shared shell. Adding a v2 tool never requires touching layout code.
- **Pure-function tool core** (`lib/tools/*.ts`). Both React and MCP handlers import these. Unit tests live here, not in UI components. Zero framework coupling.
- **MCP paywall stub**. `lib/mcp/paywall.ts` returns `{jsonrpc: "2.0", error: {code: -32001, message: "This tool requires a drwho.me MCP subscription", data: {upgradeUrl: "https://drwho.me/mcp", tier: "paid"}}}` with HTTP 402 for every tool call. Handshake + tool listing still work so directories can index. Swap to real billing in v2.
- **Edge-first data**. What-is-my-IP reads Vercel edge headers server-side; no external provider call, no rate limit. IP lookup and DNS endpoints use aggressive edge caching (`s-maxage=86400` and `3600` respectively) so free-tier providers are hit rarely.

## 5. Design System

### 5.1 Typography

- **Primary**: JetBrains Mono (latin subset, self-hosted via `next/font/google`).
- **Fallback**: `ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`.
- **Scale**: `12 / 14 / 16 / 20 / 28 / 40px` — no other sizes.
- **Line height**: `1.6` body, `1.2` headings.
- **Weights**: `400` body, `500` labels, `600` headings.

### 5.2 Color tokens (CSS vars in `globals.css`)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0a0a0a` | `#fafafa` | page background |
| `--fg` | `#d4d4d4` | `#171717` | body text |
| `--muted` | `#737373` | `#737373` | secondary text |
| `--accent` | `#4ade80` | `#16a34a` | prompts, active, links |
| `--border` | `#1f1f1f` | `#e5e5e5` | thin dividers |

Theme toggled via `data-theme` attr on `<html>`. First-visit default respects `prefers-color-scheme`. Persisted in `localStorage` as `drwho-theme`.

### 5.3 Layout rhythm

- Max content width: **680px**, centered.
- Spacing: 8px grid.
- Borders: 1px, `--border`, always. No shadows anywhere. Max border-radius: 4px.

### 5.4 Terminal motifs (used sparingly)

- Logo: `drwho▮` — block is a CSS-animated blinking cursor, respects `prefers-reduced-motion: reduce`.
- Tool page `<h1>`: `> ip_lookup` — accent-colored `>` prefix.
- Breadcrumb: `~/tools/ip-lookup` — monospace path notation.
- Result containers: `TerminalCard` — thin border, optional `$ command-line` top label.

### 5.5 Responsive rules (first-class concern)

- Single column layout always. No dashboard-style multi-pane.
- Mobile ≤ 640px: 16px horizontal padding, 14px base font.
- Desktop ≥ 640px: 680px max width, 16px base font.
- Nav: mobile → hamburger opening full-screen tool list; desktop → inline dropdown.
- Home grid: 1 col mobile, 2 col ≥ 480px, stays at 2 cols on desktop (intentional — preserves calm rhythm).
- Tap targets: ≥ 44×44px.
- Long strings (IPs, UAs, tokens) wrap with `word-break: break-all` inside result boxes.
- Ad units: responsive — `320×100` mobile / `728×90` desktop, with `AdSlot` reserving layout space to prevent CLS.

### 5.6 Component inventory (7)

`TerminalCard`, `TerminalPrompt`, `CopyButton`, `ThemeToggle`, `AdSlot`, `AffiliateCard`, `ToolCard`.

## 6. Page Layouts

### 6.1 Home (`/`)

- Nav (sticky top).
- Hero (3 short lines): `> drwho.me` / "network + dev tools. minimal and fast." / (muted) "no signup. no tracking beyond ads."
- Tool grid: 2 cols, grouped by category label (`network` / `dev utilities`). Each `ToolCard`: name, 1-line description, small category tag.
- One-paragraph "about the site".
- Footer.

### 6.2 Tool page (`/tools/[slug]`)

- Nav.
- Breadcrumb: `~/tools/<slug>`.
- `<h1>`: `> <slug>`.
- One-sentence description (muted).
- `TerminalCard` with tool input + output.
- `AdSlot` below tool.
- Conditional `AffiliateCard` on pages where relevant (see §7).
- One-paragraph "how it works" (minimal per-page content by decision).
- JSON-LD `SoftwareApplication` injected server-side.
- Footer.

### 6.3 Blog (`/blog`)

- Nav.
- Post list: title + 1-line excerpt + date, separated by thin rules.
- Footer.

### 6.4 Blog post (`/blog/[slug]`)

- Nav.
- Title, date, reading time (muted).
- MDX body. Code blocks styled to match TerminalCard.
- `AdSlot` between sections (1 per post max at launch).
- "Related tools" strip linking to 2–3 tools in the registry.
- JSON-LD `Article`.
- Footer.

### 6.5 Legal pages (`/about`, `/privacy`, `/terms`, `/contact`)

- MDX content, rendered in the standard 680px column.
- Contact page has a form (name, email, message) that submits via a Next.js server action → Resend email to an inbox TBD.

### 6.6 MCP landing (`/mcp`)

- Tool list (auto-generated from registry, MCP-compatible tools only).
- "Coming soon — paid subscription" copy.
- Waitlist email form (server action → Resend notification + Vercel KV write for later outreach).
- Documentation snippet showing how to add `https://drwho.me/mcp` to Claude Desktop / ChatGPT.

## 7. Monetization

### 7.1 AdSense

- **One ad slot per tool page**: below the tool, above the "how it works" copy.
- **One ad slot per blog post**: mid-content.
- **Home page: no ads** (better UX, encourages exploration).
- `<AdSlot>` reserves vertical space to prevent Cumulative Layout Shift.
- Use **Google Auto Ads** during the approval period; switch to manual placements after approval.
- Default to **non-personalized ads** so no cookie banner is needed. If personalized ads are enabled later, ship a minimal ~20-line consent banner component.

### 7.2 Affiliates

Placement is per-tool and must be contextually relevant. Config in `content/affiliates.ts`:

| Tool page | Affiliate card |
|---|---|
| `/tools/ip` | "Hide this IP — NordVPN / Mullvad" (VPN program) |
| `/tools/ip-lookup` | "Hide this IP — NordVPN" |
| `/tools/dns` | "Fast DNS — Cloudflare 1.1.1.1 / NextDNS" |
| `/tools/jwt` | "1Password for devs" (password manager affiliate) |
| `/tools/uuid` | (none — no obvious fit) |

- Visual style: small `AffiliateCard`, thin-bordered, `sponsor` label in muted, small link. Never above the fold, never more prominent than the tool itself.
- Footer on every page: "drwho.me contains affiliate links. See our [disclosure](/privacy#affiliates)."

### 7.3 MCP paid tier

- Stubbed at launch: endpoint lists tools but returns HTTP 402 + MCP error payload on call.
- v2 will add Stripe subscription + API key middleware.

## 8. Data Flow

### 8.1 Dev utilities (6 tools)

100% client-side. Input → pure function in `lib/tools/*.ts` → output. Works offline. Zero network calls.

### 8.2 What-is-my-IP

- `app/tools/[slug]/page.tsx` for slug `ip` uses the `WhatIsMyIp` server component.
- Server reads `headers()` → `x-forwarded-for`, `x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-latitude`, `x-vercel-ip-longitude`, `x-vercel-ip-timezone`.
- Renders IP info server-side (zero-flicker first paint).
- Client `refresh` button calls `/api/whoami` which returns the same headers JSON.

### 8.3 IP lookup

- Form posts `ip` to `/api/ip-lookup`.
- Server route calls `lib/tools/ipLookup.ts::lookupIp(ip)` → ipinfo.io with `IPINFO_TOKEN`.
- Response cached: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.
- Client renders the result in a `TerminalCard`.

### 8.4 DNS lookup

- Form posts `{name, type}` to `/api/dns`.
- Server route calls `lib/tools/dns.ts::resolveDns(name, type)` → Cloudflare DoH JSON (`https://cloudflare-dns.com/dns-query` with `Accept: application/dns-json`).
- Response cached: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Client renders the answer section.

### 8.5 MCP endpoint

- `app/mcp/route.ts` using `@vercel/mcp-adapter`.
- On `initialize` → server capabilities, tools list (from `lib/mcp/server.ts`, which wraps every `lib/tools/*.ts` function with `withPaywall`).
- On `tools/call` → `withPaywall` returns the 402 JSON-RPC error before the tool runs.
- Swapping `withPaywall` for a real billing middleware is a one-line change in v2.

## 9. Error Handling

- **Network route handlers**: one `try/catch`. On failure, return `{error: "couldn't reach provider", retryable: true}` with HTTP 502. UI renders a terminal-styled `error: ...` line and a retry button.
- **Dev utilities**: input-level validation only (e.g. invalid JSON shows parse error location). No exception wrapping beyond that.
- **No global error boundary**. Next.js default `error.tsx` and `not-found.tsx` at the app level, styled to match.
- **No toast library**. Results and errors render inline inside the `TerminalCard`.

## 10. SEO

- Per-tool unique `<title>` `"{name} — drwho.me"` and `<meta name="description">` from registry.
- Canonical URL per page via `metadata.alternates.canonical`.
- Dynamic OG images via `next/og` — 1200×630, monospace, tool name + tagline.
- `sitemap.xml` generated by `app/sitemap.ts` from registry + MDX frontmatter.
- `robots.txt` via `app/robots.ts` — allow all, point to sitemap.
- JSON-LD per page: `SoftwareApplication` for tools, `Article` for posts, `WebSite` on home.
- Semantic HTML throughout (`<h1>`, `<h2>`, `<article>`, `<nav>`).
- Core Web Vitals target: LCP < 1.5s, CLS < 0.05, INP < 200ms. Enforced by Lighthouse CI in GitHub Actions (fail build if Performance or SEO < 95).

## 11. Analytics & Consent

- **Vercel Analytics** for Web Vitals + page views (cookieless, first-party).
- **No third-party analytics** at launch.
- Non-personalized AdSense until a consent banner is built (planned for a later sprint, not v1).

## 12. Testing

- **Vitest unit tests** for every `lib/tools/*.ts` — the MCP server depends on these, so high coverage here matters most.
- **React Testing Library** smoke tests per tool component — renders, accepts input, shows output.
- **Playwright** E2E: one `smoke.spec.ts` that visits home, clicks into each tool, verifies page loads + no console errors.
- **Lighthouse CI** in GitHub Actions — fails if Performance or SEO scores drop below 95.

## 13. Deployment

- Vercel project, `main` branch → production, PR → preview deploy.
- Domain setup: GoDaddy DNS for `drwho.me` → Vercel (A record or nameservers per Vercel's docs). `www.drwho.me` redirects to apex.
- Env vars set in Vercel dashboard (never committed).
- GitHub Actions: lint (Biome), typecheck (tsc), unit tests (Vitest), E2E (Playwright headless), Lighthouse CI. Required to merge.
- Branch protection on `main`: require PR + passing checks.

## 14. Content Strategy

### 14.1 Launch blog posts (5)

Targeted for AdSense approval + early organic search:

1. `what-is-an-ip-address.mdx` — ~1200 words, explains IPv4/IPv6, public/private, links to `/tools/ip`.
2. `understanding-asns.mdx` — ~800 words, what ASNs are, how to look them up, links to `/tools/ip-lookup`.
3. `dns-record-types-explained.mdx` — ~1000 words, A/AAAA/MX/TXT/CNAME/NS, links to `/tools/dns`.
4. `jwt-structure.mdx` — ~800 words, header/payload/signature, links to `/tools/jwt`.
5. `base64-explained.mdx` — ~600 words, encoding basics, links to `/tools/base64`.

### 14.2 Per-tool copy (minimal)

Each tool page has a one-paragraph "how it works" — enough for indexing, not so much it feels like an article. Blog posts carry the long-form content.

### 14.3 Legal pages (launch requirement)

- `/about` — short site description.
- `/privacy` — what's collected (IP for display only, Vercel Analytics, AdSense cookies if enabled), how to contact.
- `/terms` — standard disclaimers, no warranty.
- `/contact` — form + email fallback.
- Affiliate disclosure inside `/privacy#affiliates`.

## 15. Launch Sequence

1. Week 1: Build v1 (tools + shell + MCP stub + legal pages). Deploy to Vercel.
2. Week 2: Write and publish 5 blog posts. Submit sitemap to Google Search Console. Submit to MCP directories (Smithery, anthropic's listing, `awesome-mcp-servers`).
3. Week 3–4: Let Google index. Check Search Console for coverage.
4. Week 5+: Apply for AdSense once pages are indexed + traffic is non-zero.
5. Post-approval: add `<AdSlot>` placements, switch from Auto Ads.
6. Ongoing: new blog post ~every 1–2 weeks. Monitor Lighthouse scores and CWV.

## 16. Open Questions / Decisions Deferred

- **Contact form target inbox**: defer until implementation — likely a forward address at `hikmahtech.com`.
- **Waitlist storage**: Vercel KV vs Resend-audience-only — decide at implementation.
- **Cookie consent banner**: not required at launch (non-personalized ads); build when personalized ads are considered.
- **Stripe billing** for MCP: v2, out of scope.

## 17. Success Criteria (v1 launch)

- All 10 tools functional on mobile + desktop in both themes.
- Lighthouse Performance ≥ 95, SEO ≥ 95, Accessibility ≥ 95 on every page.
- `sitemap.xml`, `robots.txt`, per-page JSON-LD present.
- MCP endpoint passes initialization handshake + tool listing from Claude Desktop; tool calls return proper 402.
- 5 blog posts live.
- Legal pages live.
- No console errors on any page.
- Lighthouse CI green in GH Actions.
