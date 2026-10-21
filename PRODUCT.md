---
one_liner: Free single-purpose tools for domains, mail and the web, most of them running in your browser, plus a free MCP server that gives the same tools to AI agents.
for_whom: Developers, sysadmins and people who run a domain and want to check one thing (an SPF record, a certificate, a header) quickly, without an account; and people who want those checks inside an AI agent.
answers:
  - how do I check my SPF record
  - how many DNS lookups does my SPF record use
  - how do I check a domain's DMARC policy
  - how do I find the DKIM selector for a domain
  - is my mail server IP on a blacklist
  - check the security headers on my site
  - when does my TLS certificate expire
  - what does my robots.txt tell GPTBot and ClaudeBot
  - does my site have an llms.txt or security.txt
  - is there a free MCP server for DNS and email checks
  - decode a JWT without sending it to a server
does_not:
  - grade results or tell you what to fix first; each tool checks one thing (the graded full report is Domain Posture)
  - run checks on a schedule, alert on changes or keep a history; every check is a single look, right now
  - produce signed reports or evidence packs (Domain Posture sells those)
  - change or fix your records; it reads them
  - give unlimited MCP use; fair use is 60 tool calls an hour per address
  - run every tool in the browser; security headers, TLS, redirects, CORS, WHOIS, certificate logs and the IP tools run on the server (it does not store what you check)
links:
  home: https://drwho.me/
  free_tool: https://drwho.me/tools
  docs: https://drwho.me/mcp           # MCP server page: endpoint, install lines, tool list
disclosure: I built this.
link_wanted: true                      # OWNER: confirm; the tools are free, no account
voice: plain and technical; answer the question first, name the tool last; one tool per post, never "suite" or "platform"
channels: [devto, bluesky, linkedin, medium]   # OWNER: confirm; developer audience, so not facebook or linkedin-page by default
---

## Positioning

drwho.me is a set of 32 free tools in six groups: Email, DNS, Site checks, Discovery, Your
connection and Developer. Each tool checks or does one thing. No account, no API key.

Most tools run in the browser. A DNS or email check goes from the browser straight to a public
service (Cloudflare DNS, crt.sh), so the domain never reaches drwho.me's server. Tools that must
read another site's response run on the server, which does not store what you check.

The same checks are open to AI agents through a free MCP server at `https://drwho.me/mcp/mcp`
(streamable HTTP, no auth, 29 read-only tools, 60 tool calls an hour per address). It installs in
Claude Code with one line. It is listed on Glama and other MCP directories.
<!-- OWNER: confirm which directory listings are live today; docs/history/2026-04-24-mcp-directories.md is from April -->

The code is open source under MIT (`github.com/hikmahtech/drwhome`). The check logic is the
MIT-licensed `@hikmahtech/dossier-checks` npm package, shared with Domain Posture.

## drwho.me and Domain Posture

Both are built by Hikmah Technologies on the same checks. They are separate products with
separate talking points:

- **drwho.me** is the free front door: one check at a time, in the browser, plus the MCP server.
  Talk about a single record or header, privacy (runs in your browser), developer utilities, and
  agents.
- **Domain Posture** (https://www.domainposture.com) runs all 18 checks at once, grades them,
  lists fixes in order, and sells scheduled monitoring, change alerts and signed evidence packs.
  Talk about that there, not here.

drwho.me links to Domain Posture from its tool pages, `/domain-report` and `/monitoring`. A
drwho.me post may mention that the full graded report exists, but must not claim drwho.me grades,
monitors or signs anything.

History: drwho.me was once Domain Posture's address. Unknown paths on drwho.me redirect with 308
to the same path on www.domainposture.com, so old links keep working (for example
`drwho.me/spf-checker` goes to Domain Posture; the drwho.me tool is at `drwho.me/tools/spf-checker`).
Always link `/tools/<slug>` URLs. The Search Console change of address from drwho.me to
domainposture.com was removed on 2026-10-01; drwho.me's pages now carry their own canonical URLs.
<!-- OWNER: confirm the change of address is still absent in GSC and drwho.me pages are being indexed -->

## Pricing

Free. Every tool on drwho.me stays free with no account. drwho.me sells nothing; monitoring is a
domainposture.com product.

## Words to avoid

- "suite", "platform", "all-in-one", "audit", "scan your whole domain": drwho.me checks one thing per tool.
- "grade", "score", "monitoring", "alerts", "evidence", "signed": those are Domain Posture.
- "no tracking" on its own: the site says "no tracking of what you look up"; it does load GA4
  for page analytics. Use the full phrase. <!-- OWNER: confirm wording -->
- "private" or "nothing leaves your browser" for server-side tools; say which tools run in the browser.
- Hype words: "powerful", "ultimate", "blazing fast", "AI-powered".
