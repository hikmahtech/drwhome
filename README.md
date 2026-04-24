# drwho.me

Minimal, fast network and developer tools at `drwho.me`.
Operated by [Hikmah Technologies](https://hikmahtechnologies.com).

## Stack

Next.js 15 · TypeScript (strict) · Tailwind v4 · Biome · Vitest · Playwright · Vercel.

## Dev

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm test          # unit
pnpm test:e2e      # e2e
pnpm lint          # biome
pnpm typecheck
pnpm build
pnpm lh           # Lighthouse CI (perf/seo ≥ 95)
```

## Env vars

Set in Vercel dashboard (do not commit):

| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | contact + waitlist email delivery |
| `CONTACT_TO_EMAIL` | inbox that receives contact + waitlist messages |
| `NEXT_PUBLIC_SITE_URL` | canonical site origin, e.g. `https://drwho.me` |
| `IPINFO_TOKEN` | ipinfo.io API token |
| `KV_REST_API_URL` | Vercel KV REST endpoint (auto-set when KV is attached) |
| `KV_REST_API_TOKEN` | Vercel KV REST auth token (auto-set when KV is attached) |
| `NEXT_PUBLIC_ADS_ENABLED` | `"true"` to load real AdSense (Plan 5) |
| `ADSENSE_CLIENT_ID` | AdSense client id (Plan 5) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID, `G-XXXXXXXXXX`. Unset → no analytics |
| `GA_API_SECRET` | GA4 Measurement Protocol API secret (server-side MCP events) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint (dossier rate limits) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

## MCP

A remote MCP endpoint lives at `/mcp/mcp` (Streamable HTTP). The handshake and tool listing are open; `tools/call` is paywalled (HTTP 402, JSON-RPC error -32001) until the paid tier opens. See `/mcp` on the site for config snippets and the waitlist.

## Dossier

- `/d/<domain>` streams 10 independent checks (DNS, MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface) as a single dossier.
- Append `?refresh=1` to bypass caches and revalidate that dossier load.
- Rate limits (per client IP): 30 `/d/<domain>` loads per hour, plus a separate 60/hour shared bucket across the standalone dossier tool pages (`/tools/dns-records-lookup`, `/tools/mx-lookup`, `/tools/spf-checker`, etc.). Unset Upstash env vars disable rate limiting (dev default).
- Abuse-prone targets are rejected at the route + MCP layer via a committed denylist in `lib/dossier/denylist.ts`.

## Layout

- `app/` — routes. `app/tools/[slug]` is the single dynamic route for every tool.
- `components/` — UI. `components/tools/*` wraps pure logic from `lib/tools/*`.
- `content/tools.ts` — tool registry, single source of truth.
- `lib/tools/*.ts` — pure-function tool logic (reused by web + MCP in Plan 4).
- `docs/superpowers/` — specs + plans.

## Deploy

Push to `main` → Vercel auto-deploys. PRs → preview deploys. Set the env vars above in Vercel before first deploy (except the Plan-deferred ones).

## Credits

Favicon: owl icon by [Lorc](https://lorcblog.blogspot.com/) via [game-icons.net](https://game-icons.net/1x1/lorc/owl.html), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
