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
