# drwho.me — Glama A / A / A Score Spec

**Status:** draft (not started)
**Author:** arshad@hikmahtechnologies.com
**Date:** 2026-04-24
**Repo:** hikmahtech/drwhome
**Glama page:** https://glama.ai/mcp/servers/hikmahtech/drwhome
**Glama score URL:** https://glama.ai/mcp/servers/hikmahtech/drwhome/score

---

## Background

drwho.me's MCP server was accepted into Glama's MCP directory on 2026-04-24 (see cmemory lesson `ee5be47a`). The punkpeye/awesome-mcp-servers PR #5017 merge is gated on a Glama badge showing **A A A** — per the bot comment from 2026-04-23T21:55:35Z:

> Please make sure the server's badge shows an [A A A score](https://glama.ai/mcp/servers/hikmahtech/drwhome/score)

As of 2026-04-23 21:58 UTC the badge renders as `— F —`. The page text breakdown confirms:

```
-
security - not tested
F
license - not found
-
quality - not tested
```

i.e. three pillars (Security, License, Quality), one graded (License = F), two untested.

---

## Current state (evidence)

| Pillar | Current | Evidence |
|---|---|---|
| Security | not tested | Glama page text: `security - not tested`. Their automated scanner has not completed. |
| License  | **F**        | Glama page text: `license - not found`. Scan predates our MIT LICENSE landing on `main`. |
| Quality  | not tested  | Glama page text: `quality - not tested`. TDQS (Tool Definition Quality Score) has not run. |

Key observations from the Glama server page's `__NEXT_DATA__` payload:
- Exposes a `hasGlamaJson` boolean — they explicitly check for a `glama.json` manifest.
- Exposes `hasReadme: true` — they check for a README (we have one).
- Links to the TDQS blog post: https://glama.ai/blog/2026-04-03-tool-definition-quality-score-tdqs

Pillars are independent. Each must be unblocked on its own.

---

## Goal

All three Glama pillars grade **A** so the badge shows `A A A` and PR punkpeye/awesome-mcp-servers#5017 clears its badge check.

---

## Pillar 1 — License: F → A

### Action
**None in code.** The fix is already on `main`.

### Evidence
- MIT `LICENSE` file at repo root (PR #7 merged 2026-04-23T21:55:31Z, squash commit `096a50d0f86665597d48bcfe314d41849e564e3e`).
- `"license": "MIT"` added to `package.json`.

### Reason for F
Glama's last license scan ran before `096a50d0` landed. The grade is stale.

### Trigger a re-scan
- **Passive:** wait for Glama's next scheduled index pass (interval undocumented — hours to days).
- **Active:** ping https://glama.ai/discord with the repo URL `https://github.com/hikmahtech/drwhome` asking for a re-scan.

### Risk
None.

---

## Pillar 2 — Quality (TDQS): not-tested → A

### Action
Rewrite **all 21** tool descriptions in `lib/mcp/tools.ts` and tighten every zod `.describe()` call.

### Scoring math (from Glama's TDQS blog post)

Each tool is scored 1–5 on six dimensions:

| Dimension | Weight |
|---|---|
| Purpose Clarity | 25% |
| Usage Guidelines | 20% |
| Behavioral Transparency | 20% |
| Parameter Semantics | 15% |
| Conciseness & Structure | 10% |
| Contextual Completeness | 10% |

- **Tool TDQS** = weighted sum of the six dimensions.
- **Server Quality** = `60% × mean(tools) + 40% × min(tools)`.
- **Letter grades:** A ≥ 3.5, B ≥ 3.0, C ≥ 2.0, D ≥ 1.0, F < 1.0.

### Why all 21

Because of the `40% × min` term, the weakest tool anchors the grade. Partial rewrites don't work — if any one tool scores 2, the whole server drops toward C.

### Current weakness (diagnostic)

Most descriptions today are a single purpose-sentence. Representative sample — `dossier_mx`:

> "Return the MX records for a domain, sorted by priority, as a CheckResult discriminated union."

Estimated per-dimension:
- Purpose Clarity: 4
- Usage Guidelines: 1–2 (no when-to-use)
- Behavioral Transparency: 3 (omits resolver, timeouts)
- Parameter Semantics: 3 ("Public FQDN." is minimal)
- Conciseness & Structure: 5
- Contextual Completeness: 2 (no `CheckResult` shape, no differentiator vs `dns_lookup` with `type=MX`)

Weighted: ~2.6 → **C** on this tool alone.

### Replacement template

Four short sentences, ≤120 words total:

1. **Purpose** — one line, what it returns.
2. **Usage** — when to call this; when to reach for something else instead.
3. **Mechanism** — data source, protocol, timeouts, limits.
4. **Returns** — output shape including error shape.

### Worked example — `dossier_mx`

> Look up a domain's MX (mail exchanger) records, sorted by priority. Use when you need to verify or audit a domain's inbound-mail routing, or as a precursor to SPF/DMARC checks; prefer `dns_lookup` with `type=MX` if you only need the raw DNS answer without the ranked view. Queries Cloudflare DoH (`1.1.1.1`), follows DNAME / CNAME aliases, times out at 5s per resolver. Returns a `CheckResult` discriminated union: on success, `{status: "ok", records: [{exchange, priority}, ...]}`; on failure, `{status: "error", reason}`.

Projected per-dimension ≈ 4.5. Applied to all 21 → mean ≈ 4.3, min ≈ 4.0 → **A**.

### Parameter descriptions

Every zod `.describe()` must carry semantics beyond the type. Example upgrade:

```ts
// Before
domain: z.string().describe("Public FQDN.")

// After
domain: z.string().describe(
  "Public FQDN, e.g. example.com. Must be resolvable on the public internet; IPs, ports, and URLs are rejected."
)
```

Parameter Semantics is 15% of each tool's score.

### Full tool list to rewrite (21)

Utilities: `ip_lookup`, `dns_lookup`, `user_agent_parse`, `json_format`, `base64_encode`, `base64_decode`, `url_encode`, `url_decode`, `jwt_decode`, `uuid_generate`.

Dossier (per-check): `dossier_dns`, `dossier_mx`, `dossier_spf`, `dossier_dmarc`, `dossier_dkim`, `dossier_tls`, `dossier_redirects`, `dossier_headers`, `dossier_cors`, `dossier_web_surface`.

Dossier aggregate: `dossier_full`.

### Files touched
- `lib/mcp/tools.ts` — 21 `description` fields + every `.describe()` call inside their `inputSchema`.
- `tests/unit/lib/mcp/tools.test.ts` — **verify** whether any assertion reads description text. Count/name assertions (per cmemory lesson) don't need updating.
- `tests/e2e/mcp.spec.ts` — **verify** whether the hardcoded `tools/list` snapshot includes description text. Per cmemory it's a name-only snapshot; confirm before merging.

### Risk
Low. Descriptions become ~5× longer but stay ≤120 words. No MCP client truncates at that length.

### Non-goals
- No behavioural change to any tool handler.
- No change to `content/tools.ts` (web UI metadata).
- No change to `inputSchema` *types* (only the `.describe()` text).

---

## Pillar 3 — Security: not-tested → A

### Action 3a — add `glama.json` at repo root

```json
{
  "$schema": "https://glama.ai/mcp/schemas/server.json",
  "name": "drwhome",
  "description": "Remote MCP server with 21 tools for Domain Dossier checks and developer utilities.",
  "server": {
    "type": "remote",
    "transport": "streamable-http",
    "url": "https://drwho.me/mcp/mcp"
  },
  "maintainers": [
    { "name": "Hikmah Technologies", "email": "arshad@hikmahtechnologies.com" }
  ],
  "license": "MIT",
  "homepage": "https://drwho.me"
}
```

### Why
- Glama's server-page state exposes a `hasGlamaJson` boolean. They explicitly look for this file.
- The docs URL `https://glama.ai/docs/mcp/glama.json` 404s (unpublished schema), but the boolean's existence is strong evidence the file is consumed.
- The manifest gives Glama's scanner:
  - **Transport + URL** — declares remote `streamable-http`, not a binary to pull and run. "Not tested" usually means the scanner couldn't classify the server.
  - **Maintainer + homepage** — trust signals.
  - **License echo** — reinforces Pillar 1.
- If the schema URL is wrong, the file is still valid JSON and still discoverable. No downside.

### Action 3b — verify unauthenticated `tools/list` works

```bash
curl -X POST https://drwho.me/mcp/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json,text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected: HTTP 200 with a `result.tools` array of 21 tools.

Notes:
- Our `MCP_PAYWALL_ENABLED` env gates `tools/call` (returns HTTP 402), **not** `tools/list` — so `tools/list` should be open to unauthenticated probes.
- Verify this on production (`https://drwho.me/mcp/mcp`), not localhost.

### Files touched
- `glama.json` (new, repo root)

### Residual unknown
If Security stays "not tested" after the manifest + a rescan, escalate to Glama Discord.

### Risk
None. New file, no runtime impact.

---

## Pillar 4 — awesome-mcp-servers PR #5017

**No action required.**

- The badge SVG (`https://glama.ai/mcp/servers/hikmahtech/drwhome/badges/score.svg`) re-renders automatically when scores flip.
- The markdown in `README.md` already embeds the badge URL unchanged.
- Punkpeye's `<!-- glama-badge-check -->` bot re-runs on the next PR event (comment or push).

Once the live badge shows A/A/A, trigger the bot by posting any PR comment. No README edit needed.

---

## Implementation plan

### PR 1 — Description rewrite + `glama.json` (one PR)

**Branch:** `worktree-glama-quality-security`

Changes:
1. `lib/mcp/tools.ts` — rewrite all 21 descriptions per the template; tighten every `.describe()`.
2. `glama.json` (new) — manifest per Action 3a.
3. Tests:
   - Re-run `pnpm test` and `pnpm test:e2e` — verify neither snapshots description *text*.
   - If a test does hash description text, update the snapshot in the same commit.

Acceptance:
- `pnpm typecheck` green.
- `pnpm test` green.
- `pnpm test:e2e` green.
- Lighthouse CI green (note: pre-existing SEO flake tracked separately in worktree `fix-lighthouse-seo-streaming-metadata` — not this PR's concern).

### PR 2 — Not needed

Everything code-side lives in PR 1. Badge change is server-side.

### Post-merge steps

1. Ping https://glama.ai/discord with:
   > "Hi — just landed a MIT LICENSE + glama.json manifest on https://github.com/hikmahtech/drwhome. Could you trigger a rescan for https://glama.ai/mcp/servers/hikmahtech/drwhome? License is currently graded F (stale), Security + Quality show not-tested. Thanks."
2. Wait for rescan. Check score at https://glama.ai/mcp/servers/hikmahtech/drwhome/score.
3. Once A/A/A:
   - Post any comment on https://github.com/punkpeye/awesome-mcp-servers/pull/5017 to re-trigger the badge-check bot.
   - Verify PR goes green.
4. Save a cmemory lesson capturing:
   - Glama's three pillars and their triggers.
   - That `glama.json` unlocked Security (or did not — record which).
   - Final Quality score and the TDQS rubric behaviour.

---

## Sequencing + effort

| # | Step | Effort | Depends on |
|---|---|---|---|
| 1 | Create worktree `worktree-glama-quality-security` | 1 min | — |
| 2 | Rewrite 21 `description` fields + `.describe()` calls | 60–90 min | 1 |
| 3 | Add `glama.json` | 5 min | 1 |
| 4 | Run `pnpm test && pnpm test:e2e && pnpm typecheck` locally | 10 min | 2, 3 |
| 5 | Update test snapshots if they reference description text | 10 min | 4 |
| 6 | `gh pr create` | 5 min | 4 |
| 7 | Merge after CI green | 5 min | 6 |
| 8 | Ping Glama Discord | 5 min | 7 |
| 9 | Verify badge flips; re-trigger punkpeye badge-check bot | 5 min | 8 (+ Glama rescan lag) |

**Active work:** ~2 hours. Plus Glama's rescan lag (hours–days).

---

## Open decisions (to confirm before kicking off)

1. **Description template format:** purpose → usage → mechanism → returns, ≤120 words. Want to see one applied to a real tool and get approval before doing all 21?
2. **glama.json contents:** maintainers block, homepage, description wording — anything to change?
3. **PR layout:** single PR (descriptions + manifest) vs split. Default recommendation: single PR.

---

## Related artefacts

- cmemory lesson `ee5be47a` — drwho.me MCP submission to Glama (2026-04-24)
- cmemory lesson `3c4a2d49` — awesome-mcp-servers PR #5017 status
- cmemory lesson `dee0c2cf` — Dockerfile + `output: "standalone"` PR #6 (Glama's automated-testing requirement)
- PR #7 (merged) — MIT LICENSE + `package.json` license field
- Design/plan doc: this file
