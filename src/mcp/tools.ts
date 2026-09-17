import {
  type CheckResult,
  type RuleSlug,
  aiCrawlerPolicyCheck,
  corsCheck,
  ctLogCheck,
  dkimCheck,
  dmarcCheck,
  dnsCheck,
  dnssecCheck,
  gradeFinding,
  headersCheck,
  llmsTxtCheck,
  mtaStsCheck,
  mxCheck,
  redirectsCheck,
  securityTxtCheck,
  spfCheck,
  tlsCheck,
  tlsrptCheck,
  validateDomain,
  webSurfaceCheck,
  whoisCheck,
} from "@hikmahtech/dossier-checks";
import { z } from "zod";
import { domainPostureUrl } from "../content/funnel";
import { decodeBase64, encodeBase64 } from "../lib/base64";
import { DNS_TYPES, resolveDns } from "../lib/dns";
import { lookupIp } from "../lib/ipinfo";
import { formatJson } from "../lib/json";
import { decodeJwt } from "../lib/jwt";
import { decodeUrl, encodeUrl } from "../lib/url";
import { parseUserAgent } from "../lib/user-agent";
import { uuidV4, uuidV7 } from "../lib/uuid";
import { checkPublic } from "../server/ssrf";
import { isDenied } from "./denylist";

/**
 * The one list of MCP tools. The HTTP endpoint, the stdio server, glama.json, server.json and
 * the /mcp page all read it, so a tool count can never drift from the code.
 */
export type McpResult = { content: { type: "text"; text: string }[]; isError?: boolean };

export type McpTool = {
  name: string;
  title: string;
  description: string;
  /** The matching tool page on drwho.me, if there is one. */
  slug?: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (input: Record<string, unknown>) => Promise<McpResult>;
};

const ok = (value: unknown): McpResult => ({
  content: [
    { type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) },
  ],
});
const fail = (text: string): McpResult => ({ content: [{ type: "text", text }], isError: true });

const DOMAIN = z
  .string()
  .describe(
    "Public domain name, e.g. example.com. IP addresses, ports, paths and protocol prefixes are rejected.",
  );

const RESULT_SHAPE =
  'Returns JSON with a status field: {status:"ok", data, fetchedAt} on success, {status:"not_applicable", reason} when the thing is genuinely absent, {status:"timeout", ms}, or {status:"error", message} when it could not be determined. Treat not_applicable as a finding and error as unknown.';

/** Where to get the graded, all-in-one report. Sent as a second text block on domain results. */
const moreFor = (domain: string, tool: string): string =>
  `Full graded report for ${domain} (all 18 checks, prioritised fixes) on Domain Posture: ${domainPostureUrl(
    "report",
    { domain, from: tool, medium: "mcp" },
  )}`;

type DomainRun = (domain: string, input: Record<string, unknown>) => Promise<CheckResult<unknown>>;

/**
 * A tool that takes a domain. `fetches` marks checks that connect to the domain's own hosts:
 * those are refused unless every address the domain resolves to is public, because this server
 * runs inside a private network. DNS-only checks talk to Cloudflare and need no such guard.
 */
function domainTool(
  def: Omit<McpTool, "handler" | "inputSchema"> & {
    fetches: boolean;
    extra?: Record<string, z.ZodTypeAny>;
    run: DomainRun;
  },
): McpTool {
  const { fetches, extra, run, ...meta } = def;
  return {
    ...meta,
    description: `${meta.description} ${RESULT_SHAPE}`,
    inputSchema: { domain: DOMAIN, ...extra },
    handler: async (input) => {
      const v = validateDomain(String(input.domain ?? ""));
      if (!v.ok) return fail(`Invalid domain: ${v.reason}`);
      if (isDenied(v.domain))
        return fail("This domain is on the drwho.me denylist for abuse reasons.");
      if (fetches) {
        const guard = await checkPublic(v.domain);
        if (!guard.ok) return fail(guard.message);
      }
      const result = await run(v.domain, input);
      return {
        content: [...ok(result).content, { type: "text", text: moreFor(v.domain, meta.name) }],
      };
    },
  };
}

const SUMMARY_CHECKS: {
  id: string;
  rule: RuleSlug;
  fetches: boolean;
  run: (d: string) => Promise<CheckResult<unknown>>;
}[] = [
  { id: "dns", rule: "dns", fetches: false, run: dnsCheck },
  { id: "mx", rule: "mx", fetches: false, run: mxCheck },
  { id: "spf", rule: "spf", fetches: false, run: spfCheck },
  { id: "dmarc", rule: "dmarc", fetches: false, run: dmarcCheck },
  { id: "dkim", rule: "dkim", fetches: false, run: dkimCheck },
  { id: "dnssec", rule: "dnssec", fetches: false, run: dnssecCheck },
  { id: "tlsrpt", rule: "tlsrpt", fetches: false, run: tlsrptCheck },
  { id: "mta_sts", rule: "mta_sts", fetches: true, run: mtaStsCheck },
  { id: "tls", rule: "tls", fetches: true, run: tlsCheck },
];

export const mcpTools: McpTool[] = [
  domainTool({
    name: "dossier_summary",
    title: "Domain summary (9 checks)",
    description:
      "Run the nine DNS, email-authentication and TLS checks on a domain in parallel and return one graded line per check: DNS records, MX, SPF, DMARC, DKIM, DNSSEC, TLS-RPT, MTA-STS and the TLS certificate. Use it first when asked how a domain is set up or whether its email can be spoofed; then call the single dossier_* tool for any check you need the raw data for. Each line has the check id, its status, a severity (info, low, medium, high, critical) and a one-line reason, graded by the same rules as Domain Posture. It does not return raw records or fix instructions, and it leaves out the nine web and discovery checks; the full 18-check graded report is linked in the result. Returns JSON {domain, checks:[{id, status, severity, reason}], worst}.",
    fetches: true,
    run: async (domain) => {
      const checks = await Promise.all(
        SUMMARY_CHECKS.map(async (c) => {
          const result = await c.run(domain);
          const grade = gradeFinding(c.rule, result, { isApex: true, host: domain });
          return {
            id: c.id,
            status: result.status,
            severity: grade.severity,
            reason: grade.reason,
          };
        }),
      );
      const order = ["info", "low", "medium", "high", "critical"];
      const worst = checks.reduce(
        (w, c) => (order.indexOf(c.severity) > order.indexOf(w) ? c.severity : w),
        "info",
      );
      // Not a CheckResult, but the wrapper only serialises it.
      return { domain, checks, worst } as unknown as CheckResult<unknown>;
    },
  }),
  domainTool({
    name: "dossier_dns",
    slug: "dns-records-lookup",
    title: "DNS records",
    description:
      "Fetch a domain's A, AAAA, NS, SOA, CAA and TXT records in one call. Use as the first step of a DNS review; prefer dns_lookup for a single record type or for MX, CNAME and SRV. Sends six Cloudflare DNS-over-HTTPS queries in parallel, 5 s timeout each.",
    fetches: false,
    run: (d) => dnsCheck(d),
  }),
  domainTool({
    name: "dossier_mx",
    slug: "mx-lookup",
    title: "MX lookup",
    description:
      "List a domain's MX (mail exchanger) records sorted by priority. Use to see where a domain's inbound mail goes, or before checking SPF and DMARC. Queries Cloudflare DNS-over-HTTPS, 5 s timeout.",
    fetches: false,
    run: (d) => mxCheck(d),
  }),
  domainTool({
    name: "dossier_spf",
    slug: "spf-checker",
    title: "SPF checker",
    description:
      "Find and parse a domain's SPF record into its mechanisms. Use to check which servers may send mail for a domain, or to debug delivery failures; pair with dossier_dmarc and dossier_dkim for the whole email-authentication picture. Reads TXT records over Cloudflare DNS-over-HTTPS. Reports records that contain v=spf1 but do not start with it (for example behind a hidden byte-order mark) as lookalikes that receivers discard, and treats more than one SPF record as an error, as RFC 7208 requires.",
    fetches: false,
    run: (d) => spfCheck(d),
  }),
  domainTool({
    name: "dossier_dmarc",
    slug: "dmarc-checker",
    title: "DMARC checker",
    description:
      "Find and parse the DMARC policy at _dmarc.<domain> into its tags (p, sp, pct, rua, ruf, adkim, aspf). Use to see whether spoofed mail is rejected, quarantined or only reported. Queries Cloudflare DNS-over-HTTPS, 5 s timeout.",
    fetches: false,
    run: (d) => dmarcCheck(d),
  }),
  domainTool({
    name: "dossier_dkim",
    slug: "dkim-lookup",
    title: "DKIM lookup",
    description:
      "Probe a domain for DKIM public keys at <selector>._domainkey.<domain>. Pass selectors when you know them; omit to probe a built-in list of common selectors used by large mail providers. A selector not on the list will not be found, so an empty result does not prove the domain has no DKIM. Distinguishes a selector that is absent from one that could not be resolved. Parallel Cloudflare DNS-over-HTTPS TXT queries.",
    fetches: false,
    extra: {
      selectors: z
        .array(z.string())
        .optional()
        .describe(
          'DKIM selector names to probe, e.g. ["google", "s1"]. Omit to use the built-in list.',
        ),
    },
    run: (d, input) => {
      const s = input.selectors;
      const selectors =
        Array.isArray(s) && s.every((x) => typeof x === "string") ? (s as string[]) : undefined;
      return dkimCheck(d, selectors ? { selectors } : {});
    },
  }),
  domainTool({
    name: "dossier_dnssec",
    slug: "dnssec-checker",
    title: "DNSSEC checker",
    description:
      "Check whether a domain's zone is signed with DNSSEC and validates: DS and DNSKEY records plus the resolver's AD (authenticated data) flag. Queries Cloudflare DNS-over-HTTPS with DO=1, 8 s timeout.",
    fetches: false,
    run: (d) => dnssecCheck(d),
  }),
  domainTool({
    name: "dossier_tlsrpt",
    slug: "tlsrpt-checker",
    title: "TLS-RPT checker",
    description:
      "Look up a domain's SMTP TLS Reporting policy at _smtp._tls.<domain>. Use to confirm the domain receives reports about failed TLS delivery of its inbound mail. Queries Cloudflare DNS-over-HTTPS.",
    fetches: false,
    run: (d) => tlsrptCheck(d),
  }),
  domainTool({
    name: "dossier_mta_sts",
    slug: "mta-sts-checker",
    title: "MTA-STS checker",
    description:
      "Fetch and validate a domain's MTA-STS policy (mode, mx, max_age). Use to confirm inbound mail to the domain must be delivered over TLS. Resolves the _mta-sts TXT record, then fetches https://mta-sts.<domain>/.well-known/mta-sts.txt, 10 s timeout.",
    fetches: true,
    run: (d) => mtaStsCheck(d),
  }),
  domainTool({
    name: "dossier_tls",
    slug: "tls-certificate-checker",
    title: "TLS certificate",
    description:
      "Read the TLS certificate a domain presents on port 443: subject, issuer, validity dates, days remaining, subject alternative names, SHA-256 fingerprint and whether the chain validated. Use to check expiry or a name mismatch. It does not test cipher suites or protocol versions. One TLS handshake from the drwho.me server, 5 s timeout.",
    fetches: true,
    run: (d) => tlsCheck(d),
  }),
  domainTool({
    name: "dossier_redirects",
    slug: "redirect-checker",
    title: "Redirect chain",
    description:
      "Trace the redirect chain from https://<domain>/, one entry per hop with its status code and target, up to 10 hops. Use to debug redirect loops or confirm an HTTP to HTTPS or apex to www redirect. 5 s per hop.",
    fetches: true,
    run: (d) => redirectsCheck(d),
  }),
  domainTool({
    name: "dossier_headers",
    slug: "security-headers-checker",
    title: "Security headers",
    description:
      "Fetch https://<domain>/ and return every response header, so you can review Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy. Returns the final URL after redirects and the headers as served. One GET, 5 s timeout. For the redirect hops themselves use dossier_redirects.",
    fetches: true,
    run: (d) => headersCheck(d),
  }),
  domainTool({
    name: "dossier_cors",
    slug: "cors-checker",
    title: "CORS checker",
    description:
      "Send a CORS preflight (OPTIONS) to https://<domain>/ and return the access-control-* headers in the answer. Use to check whether a site accepts cross-origin requests from a given origin and method. One request, 5 s timeout.",
    fetches: true,
    extra: {
      origin: z
        .string()
        .optional()
        .describe(
          "Origin header to send, e.g. https://app.example.com. Defaults to https://domainposture.com.",
        ),
      method: z
        .string()
        .optional()
        .describe("Access-Control-Request-Method to send, e.g. POST. Defaults to GET."),
    },
    run: (d, input) =>
      corsCheck(d, {
        origin: typeof input.origin === "string" ? input.origin : undefined,
        method: typeof input.method === "string" ? input.method : undefined,
      }),
  }),
  domainTool({
    name: "dossier_web_surface",
    slug: "web-surface-inspector",
    title: "Web surface",
    description:
      "Summarise a domain's public web surface: robots.txt, sitemap.xml and the home page's title, description, OpenGraph and Twitter card tags. Use for a quick SEO or link-preview review. Three parallel HTTPS fetches capped at 64 KB each.",
    fetches: true,
    run: (d) => webSurfaceCheck(d),
  }),
  domainTool({
    name: "dossier_ai_crawlers",
    slug: "ai-crawler-checker",
    title: "AI-crawler policy",
    description:
      "Report what a domain's robots.txt says to the major AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot, meta-externalagent): allowed, blocked or unspecified for each. Use to answer whether a site lets AI models train on or retrieve its content. A missing robots.txt is data, not an error: every crawler is then unspecified. One fetch, 10 s timeout.",
    fetches: true,
    run: (d) => aiCrawlerPolicyCheck(d),
  }),
  domainTool({
    name: "dossier_llms_txt",
    slug: "llms-txt-checker",
    title: "llms.txt checker",
    description:
      "Check whether a domain publishes an llms.txt, the markdown index some sites provide for AI agents. Requires a non-HTML content type and a leading markdown heading, so a catch-all page that answers 200 with HTML does not count. One fetch, 10 s timeout.",
    fetches: true,
    run: (d) => llmsTxtCheck(d),
  }),
  domainTool({
    name: "dossier_security_txt",
    slug: "security-txt-checker",
    title: "security.txt checker",
    description:
      "Check whether a domain publishes /.well-known/security.txt (RFC 9116), the standard way to tell researchers where to report a vulnerability. Returns the Contact and Expires fields. Requires a non-HTML content type and a Contact field. One fetch, 10 s timeout.",
    fetches: true,
    run: (d) => securityTxtCheck(d),
  }),
  domainTool({
    name: "dossier_whois",
    slug: "whois-lookup",
    title: "WHOIS lookup",
    description:
      "Look up a domain's registrar, creation date, expiry date and registry statuses. Use for an ownership or expiry check. Tries WHOIS over TCP port 43, then RDAP over HTTPS when the registry refuses; returns not_applicable when neither answers, which is common for some country-code domains. 15 s timeout.",
    fetches: false,
    run: (d) => whoisCheck(d),
  }),
  domainTool({
    name: "dossier_ct_log",
    slug: "ct-log-lookup",
    title: "Certificate log lookup",
    description:
      "List subdomains of a domain that appear in Certificate Transparency logs. Use to map what hosts a domain has exposed through the certificates issued for it. Queries crt.sh, then certspotter if crt.sh fails; capped at 100 unique names, 10 s timeout. A name in the log is not proof the host still exists.",
    fetches: false,
    run: (d) => ctLogCheck(d),
  }),
  {
    name: "dns_lookup",
    slug: "dns",
    title: "DNS lookup",
    description:
      "Resolve one DNS record type (A, AAAA, MX, TXT, NS, CNAME, SOA, CAA or SRV) for a name and return the raw answers. Use for a quick, targeted lookup, including on subdomains and names such as _dmarc.example.com; prefer dossier_dns for a domain's main records in one call. Queries Cloudflare DNS-over-HTTPS. Returns a JSON array of {name, type, TTL, data}; an empty array means the name exists but has no record of that type.",
    inputSchema: {
      name: z.string().describe("Name to resolve, e.g. example.com or mail.example.com."),
      type: z.enum(DNS_TYPES).describe("Record type to query."),
    },
    handler: async (input) => {
      const r = await resolveDns(
        String(input.name ?? ""),
        input.type as (typeof DNS_TYPES)[number],
      );
      return r.ok ? ok(r.answers) : fail(r.error);
    },
  },
  {
    name: "ip_lookup",
    slug: "ip-lookup",
    title: "IP lookup",
    description:
      "Look up an IPv4 or IPv6 address: city, region, country, coordinates, timezone and the network (ASN and organisation) that announces it. Use when you need location or ownership context for an address; it does not accept hostnames, so resolve those with dns_lookup first. Data comes from ipinfo.io and location is approximate. Returns JSON {ip, city, region, country, loc, org, timezone}.",
    inputSchema: {
      ip: z.string().describe("IPv4 or IPv6 address, e.g. 1.1.1.1 or 2606:4700::1111."),
    },
    handler: async (input) => {
      const r = await lookupIp(String(input.ip ?? ""));
      return r.ok ? ok(r.data) : fail(r.error);
    },
  },
  {
    name: "user_agent_parse",
    slug: "user-agent",
    title: "User agent parser",
    description:
      "Parse a User-Agent header into browser, operating system, device and rendering engine. Use when reading server logs or request headers. Runs locally with no network call. Returns JSON {browser:{name,version}, os:{name,version}, device:{type,vendor,model}, engine:{name}}; unknown fields are empty strings.",
    inputSchema: { ua: z.string().describe("The full User-Agent header value.") },
    handler: async (input) => ok(parseUserAgent(String(input.ua ?? ""))),
  },
  {
    name: "base64_encode",
    slug: "base64",
    title: "Base64 encode",
    description:
      "Encode UTF-8 text as base64. Set url_safe for the URL-safe alphabet (- and _ in place of + and /, no padding), as used in JSON Web Tokens. Runs locally. Returns the encoded string.",
    inputSchema: {
      text: z.string().describe("Text to encode."),
      url_safe: z
        .boolean()
        .optional()
        .describe("Use the URL-safe alphabet without padding. Default false."),
    },
    handler: async (input) =>
      ok(encodeBase64(String(input.text ?? ""), { urlSafe: input.url_safe === true })),
  },
  {
    name: "base64_decode",
    slug: "base64",
    title: "Base64 decode",
    description:
      "Decode base64 to UTF-8 text. Accepts the standard and the URL-safe alphabet, with or without padding or line breaks. Fails when the input is not valid base64 or does not decode to text (binary data is not returned). Runs locally.",
    inputSchema: { text: z.string().describe("Base64 or base64url string.") },
    handler: async (input) => {
      const r = decodeBase64(String(input.text ?? ""));
      return r.ok ? ok(r.value) : fail(r.error);
    },
  },
  {
    name: "jwt_decode",
    slug: "jwt",
    title: "JWT decoder",
    description:
      "Decode a JSON Web Token's header and payload. It does NOT verify the signature, so never treat the claims as trusted on the strength of this tool. Use to inspect claims such as exp, iss and aud while debugging. Runs locally; the token is not stored or sent anywhere. Returns JSON {header, payload, signature}.",
    inputSchema: {
      token: z.string().describe("The JWT: three base64url parts separated by dots."),
    },
    handler: async (input) => {
      const r = decodeJwt(String(input.token ?? ""));
      return r.ok
        ? ok({ header: r.header, payload: r.payload, signature: r.signature })
        : fail(r.error);
    },
  },
  {
    name: "json_format",
    slug: "json",
    title: "JSON formatter",
    description:
      "Validate JSON and re-print it with an indent of 2 or 4 spaces, or minified with indent 0. Use to check whether a string is valid JSON or to make it readable. Runs locally. Returns the formatted JSON, or the parser's error message.",
    inputSchema: {
      text: z.string().describe("The JSON text."),
      indent: z
        .union([z.literal(0), z.literal(2), z.literal(4)])
        .optional()
        .describe("Spaces per level: 0 (minify), 2 or 4. Default 2."),
    },
    handler: async (input) => {
      const indent = input.indent === 0 || input.indent === 4 ? input.indent : 2;
      const r = formatJson(String(input.text ?? ""), indent);
      return r.ok ? ok(r.value) : fail(r.error);
    },
  },
  {
    name: "url_encode",
    slug: "url-codec",
    title: "URL encode",
    description:
      "Percent-encode text for use in a URL query value or path segment (encodeURIComponent rules: everything except letters, digits and - _ . ! ~ * ' ( ) is encoded). Runs locally. Returns the encoded string.",
    inputSchema: { text: z.string().describe("Text to encode.") },
    handler: async (input) => ok(encodeUrl(String(input.text ?? ""))),
  },
  {
    name: "url_decode",
    slug: "url-codec",
    title: "URL decode",
    description:
      "Decode percent-encoded text. Fails on a malformed sequence such as a lone % sign. A plus sign is left as a plus; replace it with a space first if the text came from an HTML form. Runs locally.",
    inputSchema: { text: z.string().describe("Percent-encoded text.") },
    handler: async (input) => {
      const r = decodeUrl(String(input.text ?? ""));
      return r.ok ? ok(r.value) : fail(r.error);
    },
  },
  {
    name: "uuid_generate",
    slug: "uuid",
    title: "UUID generator",
    description:
      "Generate UUIDs. Version 4 is fully random. Version 7 starts with a millisecond timestamp, so values sort by creation time, which suits database keys. Runs locally with a cryptographic random source. Returns a JSON array of strings.",
    inputSchema: {
      version: z
        .union([z.literal(4), z.literal(7)])
        .optional()
        .describe("UUID version: 4 or 7. Default 4."),
      count: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("How many to generate, 1 to 100. Default 1."),
    },
    handler: async (input) => {
      const count =
        typeof input.count === "number" ? Math.min(100, Math.max(1, Math.floor(input.count))) : 1;
      const make = input.version === 7 ? () => uuidV7() : uuidV4;
      return ok(Array.from({ length: count }, make));
    },
  },
];

export const findMcpTool = (name: string): McpTool | undefined =>
  mcpTools.find((t) => t.name === name);
