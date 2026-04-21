# drwho.me — Codex instructions

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind v4 · Biome · Vitest · Playwright · pnpm · Vercel.

## Invariants
- All tool logic is pure functions in `lib/tools/*.ts`. Web UI (`components/tools/*`) and MCP handlers (`lib/mcp/server.ts`, Plan 4) both import these. No logic in components.
- `content/tools.ts` is the only place the tool list is declared. Home grid, dynamic route, sitemap, and MCP server all read from it.
- Theme tokens live in `app/globals.css` as CSS variables. Do not hardcode colors anywhere else.
- Max content width is 680px. Never override.
- Monospace everywhere. Do not introduce a second font family.
- No shadows. Border-radius capped at 4px. Single-column layout.

## Credentials
Never hardcode secrets. Use env vars. List in `README.md`.

## Testing
- `lib/tools/*.ts` require unit tests. Aim for high coverage.
- Components get smoke-level RTL tests.
- One Playwright E2E per tool (visit route, exercise, assert output).
- Lighthouse CI gates on Performance ≥ 95, SEO ≥ 95 (Plan 3).

## Commit style
Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
