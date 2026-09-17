# drwho.me

[![drwhome MCP server](https://glama.ai/mcp/servers/hikmahtech/drwhome/badges/score.svg)](https://glama.ai/mcp/servers/hikmahtech/drwhome)

Free tools for domains, mail and the web, and a free MCP server that gives the same tools to AI
agents. No account, no API key.

- Site: https://drwho.me
- MCP endpoint: `https://drwho.me/mcp/mcp` (streamable HTTP)

Most tools run in your browser. A DNS or email check goes from your browser straight to
Cloudflare's public DNS, so the domain you look up never reaches our server. Tools that must read
another site's response (security headers, TLS certificate, redirects) run on the server, which
does not store what you check.

drwho.me is built by [Hikmah Technologies](https://hikmahtechnologies.com), the team behind
Domain Posture. Each tool here checks one thing. Domain Posture runs every check at once, grades
them and tells you what to fix first.

## Use the MCP server

Claude Code:

```
claude mcp add --transport http drwho https://drwho.me/mcp/mcp
```

Most other clients take this shape (check your client's docs):

```json
{ "mcpServers": { "drwho": { "url": "https://drwho.me/mcp/mcp" } } }
```

Fair use: 60 tool calls per hour per address. Listing the tools is never limited.

To run it yourself over stdio:

```
docker build -t drwho-mcp .
docker run -i --rm drwho-mcp
```

### Tools

| Tool | What it does |
|---|---|
| `dossier_summary` | Nine DNS, email and TLS checks on a domain, one graded line each |
| `dossier_dns`, `dossier_mx`, `dossier_dnssec` | DNS records, mail servers, DNSSEC |
| `dossier_spf`, `dossier_dmarc`, `dossier_dkim` | Email authentication |
| `dossier_mta_sts`, `dossier_tlsrpt` | Inbound mail TLS policy and reporting |
| `dossier_tls`, `dossier_headers`, `dossier_redirects`, `dossier_cors` | TLS certificate, response headers, redirect chain, CORS preflight |
| `dossier_web_surface`, `dossier_ai_crawlers`, `dossier_llms_txt`, `dossier_security_txt` | robots.txt, sitemap, page metadata, AI-crawler policy, llms.txt, security.txt |
| `dossier_whois`, `dossier_ct_log` | Registration data, subdomains in certificate logs |
| `dns_lookup`, `ip_lookup`, `user_agent_parse` | One DNS record type, IP location and network, user agent parsing |
| `base64_encode`, `base64_decode`, `jwt_decode`, `json_format`, `url_encode`, `url_decode`, `uuid_generate` | Developer utilities, run locally |

Every tool is read-only. A result for a domain also links to the full graded report on Domain
Posture.

## How it is built

TypeScript on Node 22. [Hono](https://hono.dev) renders the pages on the server as plain HTML.
There is no client framework: two small custom elements (`<dw-check>`, `<dw-live>`) run the tools
in the page. The check logic is the MIT-licensed
[`@hikmahtech/dossier-checks`](https://www.npmjs.com/package/@hikmahtech/dossier-checks) package,
shared by the browser, the server and the MCP server.

```
src/content/tools.ts   the tool list; pages, sitemap and navigation read it
src/checks/            which checks run in the browser and which on the server
src/reports/           turns a check result into a report: a verdict and rows
src/lib/               pure logic for the developer tools (also used by MCP)
src/client/            browser scripts, one bundle per tool kind
src/views/             pages; tool views are found by file name
src/mcp/               the MCP tools, the HTTP endpoint, the manifests
src/server/            client address, rate limit, outbound network guard
```

`docs/ADDING_A_TOOL.md` explains how to add a tool.

### Safety

The server fetches sites that visitors name, so it guards its own network. Before a check runs,
the domain must resolve only to public addresses. On top of that, every outgoing connection is
checked at the socket layer, whichever library opens it, so a redirect, a changed DNS answer or a
WHOIS referral cannot reach a private address. See `src/server/ssrf.ts`.

The content security policy allows no inline or evaluated script.

## Run it

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm lint
```

Configuration is in `.env.example`. Everything is optional: without `IPINFO_TOKEN` the two IP
tools say they are not configured, and without `GA_MEASUREMENT_ID` no analytics loads.

`glama.json` and `server.json` are generated from the code with `pnpm manifests`. A test fails if
they are out of date.

## Deploy

`Dockerfile.web` is the website and the hosted MCP endpoint. `Dockerfile` is the stdio MCP
server. `.paas/app.yaml` is the manifest for [koyracloud](https://koyracloud.com).

Unknown paths redirect to the same path on domainposture.com. drwho.me used to be that product's
address, and links and signed documents issued then must keep working.

## Licence

MIT
