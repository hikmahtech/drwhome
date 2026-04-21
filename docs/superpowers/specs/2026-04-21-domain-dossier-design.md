# Domain Dossier — Design

**Date:** 2026-04-21
**Status:** Draft v1 (flagship for drwho.me)

## Goal

Turn drwho.me from a grid of independent utility tools into a site built around a flagship page: **one URL per domain that aggregates everything drwho can tell you about it.**

Enter `stripe.com` once and get a single page with DNS records, TLS cert chain, email authentication (SPF/DKIM/DMARC/MX), CORS policy, security headers, redirect chain, robots/sitemap, and OpenGraph/meta preview. A shareable permalink: `drwho.me/d/stripe.com`.

Each check is also a standalone tool at its own URL, with its own MCP function, so the flagship and the satellites are literally the same code composed two ways.

## Non-goals (v1)

- No paid tier. No accounts. No login.
- No monitoring, no history, no change alerts. (These are the B-bet if traffic materialises — deliberately deferred.)
- No subdomain enumeration, no WHOIS, no Wayback, no tech-stack fingerprinting. (Bundle C from brainstorming — added later as async sections without re-architecting.)
- No support for IPs, paths, ports, or private address space as dossier targets. Public FQDNs only.

## Architecture

Existing invariants from `CLAUDE.md` stand unchanged:

- Pure functions live in `lib/`. UI components live in `components/`. Both web and MCP import the same pure functions.
- `content/tools.ts` remains the single tool registry. Each dossier check adds one entry.
- Monospace, 680px max width, no shadows, radius ≤ 4px, theme tokens in `app/globals.css` only.

The dossier adds a second composition layer on top:

```
lib/dossier/
  types.ts            CheckResult<T> discriminated union
  registry.ts         list of all checks (analog of content/tools.ts)
  dossier.ts          composes all 10 checks in parallel
  checks/
    dns.ts            pure fn: (domain) => CheckResult<DnsRecords>
    tls.ts
    spf.ts
    dkim.ts
    dmarc.ts
    mx.ts
    headers.ts
    cors.ts
    redirects.ts
    web-surface.ts    robots + sitemap + OG + meta

app/d/[domain]/
  page.tsx            RSC with Suspense per section
  loading.tsx
  not-found.tsx

components/dossier/
  CheckSection.tsx    generic wrapper: title, status badge, content slot
  sections/
    DnsSection.tsx    one per check
    TlsSection.tsx
    ...

lib/mcp/tools.ts      adds dossier_<check> * 10 and dossier_full
```

### The CheckResult contract

Every pure check function has the signature:

```ts
async (domain: string) => CheckResult<T>
```

Zero knowledge of React. Zero knowledge of MCP. The return type is a discriminated union:

```ts
type CheckResult<T> =
  | { status: "ok"; data: T; fetchedAt: string }
  | { status: "timeout"; ms: number }
  | { status: "not_applicable"; reason: string }
  | { status: "error"; message: string };
```

`not_applicable` is distinct from `error`: a domain with no DMARC record is not an error, it's a meaningful finding. The UI renders differently for each variant.

Error handling lives in the type, so the UI pattern-matches on `status` and the MCP tool returns the same union as structured content.

## Rendering strategy

`/d/[domain]/page.tsx` is a server component.

1. The shell renders immediately: domain header, table of contents, ten section skeletons.
2. Each section is an async server component wrapped in its own `<Suspense>`. They run in parallel on the server, stream HTML to the client as they resolve, and each slot is replaced in-place.
3. Each section also renders a direct permalink (`/d/example.com#tls`) and a link to the standalone tool page (`/tools/dossier-tls?domain=example.com`).
4. No client-side fetching. No loading spinners flashing. Progressive fill-in.
5. JS-disabled clients wait for the full response then get complete HTML — the page is fully functional without JavaScript.

**Per-check timeout: 5 seconds.** A check that exceeds it renders its `timeout` variant; the rest of the page is unaffected.

## Caching

`unstable_cache` keyed by `(check-name, domain)` with per-check TTLs:

| Check | TTL |
|---|---|
| DNS, SPF, DMARC, MX | 1 hour |
| TLS cert | 6 hours |
| Headers, CORS, redirects, robots, sitemap, OG/meta | 15 minutes |

`?refresh=1` query param bypasses the cache and revalidates that dossier load. Every section displays a `fetchedAt` timestamp so users see freshness.

## Input validation and abuse controls

- Domain parameter parsed with the WHATWG `URL` API and validated against a public-FQDN regex.
- Reject: IPs (v4 or v6), `localhost`, RFC1918 / RFC4193 / ULA ranges, `.local`, `.internal`, `.test`, `.example`, ports, paths, query strings, userinfo.
- Rate limit: **30 dossier loads per IP per hour**, backed by Upstash Redis (the only new external dependency). Individual standalone-tool calls share a separate 60/hour bucket.
- Static denylist of abuse-prone targets, populated reactively.
- No login, no cookies beyond Vercel's own, no PII logged.

## MCP integration

10 new per-check tools, 1 aggregate:

- `dossier_dns(domain)`
- `dossier_tls(domain)`
- `dossier_spf(domain)`
- `dossier_dkim(domain, selector?)`
- `dossier_dmarc(domain)`
- `dossier_mx(domain)`
- `dossier_headers(domain)`
- `dossier_cors(domain, origin?, method?)`
- `dossier_redirects(domain)`
- `dossier_web_surface(domain)`
- `dossier_full(domain)` — returns all 10 `CheckResult` objects in one call

All return the `CheckResult<T>` union as **structured content** using the MCP spec's `structuredContent` + `outputSchema` — agents get reliable JSON-schema-validated parsing rather than free-form text.

`dossier_full` counts as one paywall call, not ten.

Paywall behavior (`MCP_PAYWALL_ENABLED` env flag) is unchanged from today.

## Monetization

Explicitly out of scope for v1.

The plan is: ship free, measure traffic for 30–60 days, then decide if the paid tier is worth building. The paid tier, if built, would be: monitor any dossier, diff when it changes (DNS, TLS cert, SPF/DMARC, subdomains later), webhook or email on change. That is the B-bet the brainstorm explicitly made contingent on C-bet traction.

## Testing

Per the existing `CLAUDE.md` invariants:

- **Vitest unit tests for every pure check** against recorded fixtures. Each check has at minimum: happy path, `not_applicable` case, `error` case, `timeout` case.
- **RTL smoke tests** for each `<Section>` component rendering each of the four `CheckResult` variants.
- **Playwright E2E #1:** load `/d/example.com`, assert all 10 sections reach a terminal state (ok / error / not_applicable / timeout) within 10s.
- **Playwright E2E #2:** load `/d/invalid..domain`, assert the not-found response.
- **Lighthouse CI:** dossier page must hit Performance ≥ 95, SEO ≥ 95 (unchanged gate).

## Security

- The server does the network calls, so clients never directly contact third-party resolvers. No API keys leak.
- Target validation blocks SSRF: no localhost/RFC1918, no IPs, no custom schemes.
- No secrets in repo. Upstash Redis URL + token read from env; documented in `README.md`.
- Per-IP rate limit caps worst-case blast radius.

## Phasing (within v1)

1. **Scaffolding.** `lib/dossier/types.ts`, `registry.ts`, empty `checks/` stubs, `/d/[domain]/page.tsx` shell with Suspense wiring, `CheckSection` wrapper component, sitemap + robots exclusion for `/d/*`.
2. **Pure checks**, ordered by dependency-free-ness, each landing with unit tests + a standalone tool entry in `content/tools.ts` + an MCP tool in `lib/mcp/tools.ts`:
   1. DNS
   2. MX
   3. SPF
   4. DMARC
   5. DKIM (common selectors: `default`, `google`, `k1`, `selector1`, `selector2`, `mxvault`)
   6. TLS
   7. Redirects
   8. Headers
   9. CORS
   10. Web-surface (robots, sitemap, OG, meta) — composite
3. **Rate limiting** (Upstash Redis) and **denylist**.
4. **Cache layer** with per-check TTLs.
5. **`dossier_full` MCP tool** exposing the aggregate.
6. **Lighthouse audit** + polish pass.

## Open questions (resolved)

- Subdomain enum, Wayback, WHOIS, tech-stack fingerprint, ASN: deferred to a post-v1 bundle.
- Paid tier: deferred until traffic justifies.
- DKIM selector discovery: v1 probes a fixed common-selectors list; user-supplied selectors via MCP `selector` arg.
- IP-target dossiers: out of scope (semantically a different product).

## What this replaces

Nothing. Existing tools in `content/tools.ts` remain unchanged. The dossier is additive: it composes new checks into a new flagship route, and each new check is also a new standalone tool, enlarging (not replacing) the existing utility grid.
