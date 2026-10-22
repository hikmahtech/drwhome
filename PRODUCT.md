---
one_liner: A free MCP server that gives AI agents 29 DNS, email, TLS and developer checks, plus 32 free single-purpose web tools for domains, mail and the web; DNS and most email checks run in your browser.
for_whom: Developers who want DNS, email and TLS checks inside an AI agent; and developers, sysadmins and people who run a domain and want to check one thing (an SPF record, a certificate, a header) quickly, without an account.
answers:
  - is there a free MCP server for DNS and email checks
  - how do I check my SPF record
  - how do I check a domain's DMARC policy
  - how do I find the DKIM selector for a domain
  - is my mail server IP on a blacklist
  - check the security headers on my site
  - when does my TLS certificate expire
  - what does my robots.txt tell GPTBot and ClaudeBot
  - does my site have an llms.txt or security.txt
  - decode a JWT without sending it to a server
does_not:
  - give a domain one overall grade or put fixes in order across checks; each tool grades its own one thing and shows the fix for it (the full graded report across 18 checks is Domain Posture)
  # Each check's verdict and "To fix" rows come from Domain Posture's own rules (src/reports/report.ts, gradedReport).
  - run checks on a schedule, alert on changes or keep a history; every check is a single look, right now
  - produce signed reports or evidence packs (Domain Posture sells those)
  - change or fix your records; it reads them
  - give unlimited use; the MCP server allows 60 tool calls an hour per address, and the server-side checks on the site allow 60 an hour per address
  # src/mcp/route.ts (callLimiter 60/h); src/app.tsx (checkLimiter 60/h, 30/h shared by callers with no address); src/views/pages/ip-lookup.tsx (30/h)
  - run every tool in the browser; 15 of the 32 run on the server (MTA-STS, all nine site checks, WHOIS, the certificate log lookup and the three connection tools), which does not store what you check
  # src/content/tools.ts (runs: "browser" | "server"); src/checks/server.ts
  - offer the blacklist check or the MCP endpoint checker over MCP; those two are web pages only
  # src/mcp/tools.ts has no blacklist or mcp-endpoint tool
links:
  home: https://drwho.me/
  free_tool: https://drwho.me/tools
  docs: https://drwho.me/mcp           # MCP server page: endpoint, install lines, tool list
disclosure: Built by Hikmah Technologies.
link_wanted: true                      # the tools are free, no account
voice: plain and technical; answer the question first, name the tool last; one tool per post, never "suite" or "platform"
channels: [linkedin-page, facebook, bluesky, devto, medium]   # developer audience: devto and bluesky first
# Company accounts only (owner, 2026-10-22): never the personal LinkedIn (`linkedin`) or a personal
# Facebook profile. devto and medium are personal-name accounts: how-to articles only, with the
# product only as the canonical link.
---

## Positioning

drwho.me is a set of 32 free tools in six groups: Email (8), DNS (4), Site checks (9), Discovery
(2), Your connection (4) and Developer (5). Each tool checks or does one thing. No account, no API
key. <!-- src/content/tools.ts -->

DNS and most email checks run in your browser (17 of the 32 tools), so the domain never reaches
drwho.me. Site checks, WHOIS and the certificate log run on the server, which does not store what
you check. Talking points use those two sentences as written.

In detail, the 17 browser tools are SPF, DMARC, DKIM, TLS-RPT, the blacklist check, the SPF and DMARC
generators, all four DNS tools, the user agent parser and the five developer tools. A browser check
goes straight from the browser to Cloudflare's public DNS (DNS over HTTPS), so the domain never
reaches drwho.me's server. The developer tools run entirely in the page. Tools that must read
another site's response or open a raw socket run on the server: MTA-STS, security headers, TLS
certificate, redirects, CORS, web surface, AI-crawler policy, llms.txt, security.txt, the MCP
endpoint checker, WHOIS and the certificate log lookup. So do "What is my IP", "IP lookup" (both
send the address to ipinfo.io) and "Request headers". The server does not store what you check.
<!-- src/checks/browser.ts, src/checks/server.ts; the CT log lookup moved to the server because
crt.sh rejects the browser's preflight. src/app.tsx connectSrc allows only cloudflare-dns.com. -->

Each check gives a verdict and, when something is wrong, the fix. The verdict comes from the same
rule Domain Posture uses, so the two sites never disagree about a domain. Some specifics worth
quoting: the DKIM lookup probes 22 common selectors; the blacklist check queries six DNS
blocklists (Barracuda, SpamCop, UCEPROTECT L1, Mailspike, PSBL, s5h.net), not Spamhaus.
<!-- src/reports/report.ts; DKIM: DEFAULT_DKIM_SELECTORS in @hikmahtech/dossier-checks 0.2.0 has 22
entries (the tool list summary in src/content/tools.ts still says 21); src/lib/blacklist.ts -->

The same checks are open to AI agents through a free MCP server at `https://drwho.me/mcp/mcp`
(streamable HTTP, no auth, 29 read-only tools, 60 tool calls an hour per address; listing the tools
is never limited). The tools: `dossier_summary` (nine DNS, email and TLS checks in one call),
18 single `dossier_*` checks, `dns_lookup`, `ip_lookup`, `user_agent_parse` and seven developer
utilities. It installs in Claude Code with one line. It is listed on Glama and in the official MCP
registry as `me.drwho/tools`.
<!-- src/mcp/tools.ts (29 tools), src/mcp/route.ts, src/mcp/manifests.ts; /.well-known/mcp-registry-auth in src/app.tsx -->
<!-- Checked 2026-10-22: registry.modelcontextprotocol.io lists me.drwho/tools as active; glama.ai/mcp/servers/hikmahtech/drwhome answers 200. -->

The code is open source under MIT (`github.com/hikmahtech/drwhome`). The check logic is the
MIT-licensed `@hikmahtech/dossier-checks` npm package, shared with Domain Posture.

## drwho.me and Domain Posture

Both are built by Hikmah Technologies on the same checks. They are separate products with
separate talking points:

- **drwho.me** is the free front door: one check at a time, plus the MCP server. Talk about a
  single record or header, privacy for the tools that run in the browser, developer utilities,
  and agents.
- **Domain Posture** (https://www.domainposture.com) runs all 18 checks at once, grades them as a
  whole, and sells signed reports, scheduled monitoring and change alerts. Talk about that there,
  not here.

drwho.me links to Domain Posture from its tool pages, `/domain-report` and `/monitoring`, always
through `/go/<target>` with UTM tags. A drwho.me post may mention that the full report exists,
but must not claim drwho.me monitors, alerts or signs anything.
<!-- src/content/funnel.ts, src/app.tsx /go/:target -->

History: drwho.me was once Domain Posture's address. Unknown paths on drwho.me redirect with 308
to the same path on www.domainposture.com, so old links and issued evidence-pack URLs keep working
(for example `drwho.me/spf-checker` goes to Domain Posture; the drwho.me tool is at
`drwho.me/tools/spf-checker`). Always link `/tools/<slug>` URLs. `www.drwho.me` redirects to
`drwho.me`. The Search Console change of address from drwho.me to domainposture.com was removed
on 2026-10-01; drwho.me's pages now carry their own canonical URLs.
<!-- src/app.tsx: www redirect and the catch-all 308 -->

## Pricing

Free. Every tool on drwho.me stays free with no account. drwho.me sells nothing; monitoring is a
domainposture.com product.

## Words to avoid

- "suite", "platform", "all-in-one", "audit", "scan your whole domain": drwho.me checks one thing per tool.
- "overall grade", "score", "monitoring", "alerts", "evidence", "signed": those are Domain Posture.
  A post may say a check "flags a problem and shows the fix"; it must not say drwho.me grades a domain.
- "no tracking" on its own: the site says "no tracking of what you look up"; it does load GA4
  (consent-gated in the EEA, UK and Switzerland) and Cloudflare Web Analytics. Use the full phrase.
  <!-- src/views/Layout.tsx, src/views/site/Privacy.tsx -->
- "private", "runs in your browser" or "nothing leaves your browser" for the whole site: 15 of 32
  tools, including most site checks, run on the server. Name which tools run in the browser.
- "unlimited": both the MCP server and the server-side checks are capped at 60 an hour per address.
- Hype words: "powerful", "ultimate", "blazing fast", "AI-powered".
