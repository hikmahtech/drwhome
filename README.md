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

## MCP

A remote MCP endpoint lives at `/mcp/mcp` (Streamable HTTP). The handshake and tool listing are open; `tools/call` is paywalled (HTTP 402, JSON-RPC error -32001) until the paid tier opens. See `/mcp` on the site for config snippets and the waitlist.

## Layout

- `app/` — routes. `app/tools/[slug]` is the single dynamic route for every tool.
- `components/` — UI. `components/tools/*` wraps pure logic from `lib/tools/*`.
- `content/tools.ts` — tool registry, single source of truth.
- `lib/tools/*.ts` — pure-function tool logic (reused by web + MCP in Plan 4).
- `docs/superpowers/` — specs + plans.

## Deploy

Push to `main` → Vercel auto-deploys. PRs → preview deploys. Set the env vars above in Vercel before first deploy (except the Plan-deferred ones).
