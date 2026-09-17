/** The only place the tool list is declared. Pages, sitemap and MCP all read from it. */
export type ToolGroup = "developer" | "email" | "dns" | "discovery" | "connection" | "site";
export type Runs = "browser" | "server";

/**
 * How the tool's page is built:
 * - check: one domain in, a report out. Needs an entry in src/checks/browser.ts or server.ts.
 * - live:  a form worked out in the page as you type. Needs src/views/forms/<slug>.tsx and
 *          src/client/<slug>.ts.
 * - page:  rendered whole on the server from the request. Needs src/views/pages/<slug>.tsx.
 */
export type ToolKind = "check" | "live" | "page";

export type Tool = {
  slug: string;
  name: string;
  summary: string;
  group: ToolGroup;
  runs: Runs;
  kind: ToolKind;
};

export const GROUPS: { id: ToolGroup; title: string }[] = [
  { id: "email", title: "Email" },
  { id: "dns", title: "DNS" },
  { id: "site", title: "Site checks" },
  { id: "discovery", title: "Discovery" },
  { id: "connection", title: "Your connection" },
  { id: "developer", title: "Developer" },
];

const LIVE = new Set([
  "dns",
  "spf-record-generator",
  "dmarc-record-generator",
  "user-agent",
  "base64",
  "jwt",
  "json",
  "url-codec",
  "uuid",
]);
const PAGE = new Set(["ip", "ip-lookup", "headers"]);

const t = (group: ToolGroup, runs: Runs, slug: string, name: string, summary: string): Tool => ({
  slug,
  name,
  summary,
  group,
  runs,
  kind: LIVE.has(slug) ? "live" : PAGE.has(slug) ? "page" : "check",
});

export const tools: Tool[] = [
  t("email", "browser", "spf-checker", "SPF checker", "Find and read a domain's SPF record."),
  t("email", "browser", "dmarc-checker", "DMARC checker", "Read the DMARC policy at _dmarc."),
  t("email", "browser", "dkim-lookup", "DKIM lookup", "Probe 21 common DKIM selectors."),
  t(
    "email",
    "browser",
    "tlsrpt-checker",
    "TLS-RPT checker",
    "Look up the SMTP TLS reporting policy.",
  ),
  t(
    "email",
    "server",
    "mta-sts-checker",
    "MTA-STS checker",
    "Fetch and validate the MTA-STS policy.",
  ),
  t(
    "email",
    "browser",
    "blacklist-check",
    "Blacklist check",
    "Check mail and web IPs against six blocklists.",
  ),
  t(
    "email",
    "browser",
    "spf-record-generator",
    "SPF generator",
    "Build an SPF record and count its lookups.",
  ),
  t(
    "email",
    "browser",
    "dmarc-record-generator",
    "DMARC generator",
    "Build a DMARC record, with warnings.",
  ),
  t("dns", "browser", "dns", "DNS lookup", "Resolve one record type."),
  t(
    "dns",
    "browser",
    "dns-records-lookup",
    "DNS records",
    "A, AAAA, NS, SOA, CAA and TXT in one go.",
  ),
  t("dns", "browser", "mx-lookup", "MX lookup", "Mail servers, sorted by priority."),
  t("dns", "browser", "dnssec-checker", "DNSSEC checker", "DS, DNSKEY and the validation flag."),
  t(
    "site",
    "server",
    "security-headers-checker",
    "Security headers",
    "HSTS, CSP and the rest, as served.",
  ),
  t(
    "site",
    "server",
    "tls-certificate-checker",
    "TLS certificate",
    "Issuer, expiry, names and fingerprint.",
  ),
  t("site", "server", "redirect-checker", "Redirect chain", "Every hop from https://domain/."),
  t("site", "server", "cors-checker", "CORS checker", "Run a preflight and read the answer."),
  t(
    "site",
    "server",
    "web-surface-inspector",
    "Web surface",
    "robots.txt, sitemap and page metadata.",
  ),
  t(
    "site",
    "server",
    "ai-crawler-checker",
    "AI-crawler policy",
    "What robots.txt tells GPTBot, ClaudeBot and others.",
  ),
  t(
    "site",
    "server",
    "llms-txt-checker",
    "llms.txt checker",
    "Is there an llms.txt for AI agents?",
  ),
  t(
    "site",
    "server",
    "security-txt-checker",
    "security.txt checker",
    "Is there a way to report a vulnerability?",
  ),
  t(
    "site",
    "server",
    "mcp-endpoint-checker",
    "MCP endpoint checker",
    "Does an MCP endpoint answer, and does it need auth?",
  ),
  t("discovery", "server", "whois-lookup", "WHOIS lookup", "Registrar, created and expiry dates."),
  t(
    "discovery",
    "server",
    "ct-log-lookup",
    "Certificate log lookup",
    "Subdomains seen in certificate transparency logs.",
  ),
  t("connection", "server", "ip", "What is my IP", "Your public address, location and network."),
  t(
    "connection",
    "server",
    "ip-lookup",
    "IP lookup",
    "Location, network and owner of any address.",
  ),
  t("connection", "server", "headers", "Request headers", "The headers your browser sends."),
  t(
    "connection",
    "browser",
    "user-agent",
    "User agent parser",
    "Browser, system and device from a UA string.",
  ),
  t("developer", "browser", "base64", "Base64", "Encode and decode, including base64url."),
  t(
    "developer",
    "browser",
    "jwt",
    "JWT decoder",
    "Read a token's header and claims. Nothing leaves the page.",
  ),
  t("developer", "browser", "json", "JSON formatter", "Format, minify and validate."),
  t("developer", "browser", "url-codec", "URL encoder", "Percent-encode and decode."),
  t("developer", "browser", "uuid", "UUID generator", "Version 4 and version 7."),
];

export const findTool = (slug: string): Tool | undefined => tools.find((x) => x.slug === slug);

/** Position in the full list, shown as the entry number (01, 02, …). */
export const toolNumber = (slug: string): string =>
  String(tools.findIndex((x) => x.slug === slug) + 1).padStart(2, "0");
