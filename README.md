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
```

## Env vars

Set in Vercel dashboard (do not commit):

| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | contact form email delivery |
| `CONTACT_TO_EMAIL` | inbox that receives contact messages |
| `NEXT_PUBLIC_SITE_URL` | canonical site origin, e.g. `https://drwho.me` |
| `NEXT_PUBLIC_ADS_ENABLED` | `"true"` to load real AdSense (Plan 5) |
| `IPINFO_TOKEN` | ipinfo.io API token (Plan 2) |
| `ADSENSE_CLIENT_ID` | AdSense client id (Plan 5) |

## Layout

- `app/` — routes. `app/tools/[slug]` is the single dynamic route for every tool.
- `components/` — UI. `components/tools/*` wraps pure logic from `lib/tools/*`.
- `content/tools.ts` — tool registry, single source of truth.
- `lib/tools/*.ts` — pure-function tool logic (reused by web + MCP in Plan 4).
- `docs/superpowers/` — specs + plans.

## Deploy

Push to `main` → Vercel auto-deploys. PRs → preview deploys. Set the env vars above in Vercel before first deploy (except the Plan-deferred ones).
