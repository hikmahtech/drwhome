import { sendMcpEvent } from "@/lib/analytics/server";
import { corsCheck } from "@/lib/dossier/checks/cors";
import { dkimCheck } from "@/lib/dossier/checks/dkim";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { headersCheck } from "@/lib/dossier/checks/headers";
import { mxCheck } from "@/lib/dossier/checks/mx";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";
import { spfCheck } from "@/lib/dossier/checks/spf";
import { tlsCheck } from "@/lib/dossier/checks/tls";
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";
import { isDenied } from "@/lib/dossier/denylist";
import { dossierChecks } from "@/lib/dossier/registry";
import { decodeBase64, encodeBase64 } from "@/lib/tools/base64";
import { DNS_TYPES, resolveDns } from "@/lib/tools/dns";
import { lookupIp } from "@/lib/tools/ipLookup";
import { formatJson } from "@/lib/tools/json";
import { decodeJwt } from "@/lib/tools/jwt";
import { decodeUrl, encodeUrl } from "@/lib/tools/url";
import { parseUserAgent } from "@/lib/tools/userAgent";
import { generateUuid } from "@/lib/tools/uuid";
import { z } from "zod";

export type McpToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

// zod shapes expected by mcp-handler's server.tool() — raw object of zod types,
// NOT `z.object({...})`. See mcp-handler README.
export type McpTool = {
  name: string;
  description: string;
  slug: string; // pointer back to content/tools.ts
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (input: Record<string, unknown>) => Promise<McpToolResult>;
};

function ok(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function fail(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

const DOMAIN_DESCRIBE =
  "Public FQDN, e.g. example.com. Must be resolvable on the public internet; IPs, ports, paths, and protocol prefixes are rejected.";

const rawMcpTools: McpTool[] = [
  {
    name: "ip_lookup",
    slug: "ip-lookup",
    description:
      "Resolve an IPv4 or IPv6 address to its geolocation, ASN, org name, and city/country. Use when you need network or location context for a raw IP address; prefer dns_lookup or dossier_dns for hostname resolution. Queries ipinfo.io with a server-side token — the token is never exposed to callers. Returns a JSON object with fields ip, city, region, country, org, loc, and timezone. On failure, returns an error string describing what went wrong.",
    inputSchema: {
      ip: z
        .string()
        .describe(
          "IPv4 or IPv6 address to look up, e.g. 1.2.3.4 or 2001:db8::1. Hostnames are not accepted.",
        ),
    },
    handler: async (input) => {
      const token = process.env.IPINFO_TOKEN ?? "";
      const ip = String((input as { ip?: string }).ip ?? "");
      const r = await lookupIp(ip, token);
      if (!r.ok) return fail(r.error);
      return ok(JSON.stringify(r.data, null, 2));
    },
  },
  {
    name: "dns_lookup",
    slug: "dns",
    description:
      "Resolve a single DNS record type (A, AAAA, MX, TXT, NS, CNAME, SOA, CAA, or SRV) and return the raw answers. Use for quick, targeted lookups of one record type; prefer dossier_dns for a full multi-type DNS audit in parallel, or dossier_full for a complete domain health check. Queries Cloudflare DoH (1.1.1.1/dns-query) over HTTPS, follows CNAME chains, 5 s timeout. Returns a JSON array of answer objects with name, type, and data fields. On error, returns a string describing the DNS failure.",
    inputSchema: {
      name: z
        .string()
        .describe(
          "Domain name or hostname to resolve, e.g. example.com or mail.example.com. FQDN preferred; relative labels are accepted.",
        ),
      type: z
        .enum(DNS_TYPES)
        .describe(
          "DNS record type to query. Common choices: A (IPv4), AAAA (IPv6), MX (mail), TXT (SPF/DKIM/verification), NS (nameservers), CNAME (alias).",
        ),
    },
    handler: async (input) => {
      const { name, type } = input as { name: string; type: (typeof DNS_TYPES)[number] };
      const r = await resolveDns(name, type);
      if (!r.ok) return fail(r.error);
      return ok(JSON.stringify(r.answers, null, 2));
    },
  },
  {
    name: "dossier_dns",
    slug: "dns-records-lookup",
    description:
      'Fetch a domain\'s full DNS profile — A, AAAA, NS, SOA, CAA, and TXT records — all in parallel. Use as the first step of a domain audit or when you need a comprehensive DNS snapshot in one call; prefer dns_lookup for a single record type, or dossier_full for all 10 dossier checks at once. Fires six Cloudflare DoH (1.1.1.1) queries concurrently, each with a 5 s timeout. Returns a CheckResult discriminated union: on success, {status:"ok", records:{a, aaaa, ns, soa, caa, txt}}; on failure, {status:"error", reason}.',
    inputSchema: {
      domain: z.string().describe(DOMAIN_DESCRIBE),
    },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await dnsCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_mx",
    slug: "mx-lookup",
    description:
      'Look up a domain\'s MX (mail exchanger) records and return them sorted ascending by priority. Use when verifying inbound-mail routing or as a precursor to SPF or DMARC checks; prefer dns_lookup with type=MX if you only need the raw DNS answer without the ranked view. Queries Cloudflare DoH (1.1.1.1), follows CNAME aliases, 5 s timeout. Returns a CheckResult discriminated union: on success, {status:"ok", records:[{exchange, priority},...]} sorted by priority; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await mxCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_spf",
    slug: "spf-checker",
    description:
      'Retrieve and parse a domain\'s SPF record, decomposing it into mechanisms and qualifiers. Use to verify email sender policy, debug delivery failures, or check the 10-lookup limit; pair with dossier_dmarc for full email-auth coverage, or use dns_lookup with type=TXT for the raw record only. Fetches TXT records via Cloudflare DoH (1.1.1.1), 5 s timeout, locates the v=spf1 record and parses all mechanisms. Returns a CheckResult: on success, {status:"ok", raw, mechanisms:[{type, value, qualifier},...], lookupCount}; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await spfCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_dmarc",
    slug: "dmarc-checker",
    description:
      'Retrieve and parse a domain\'s DMARC policy from its _dmarc.<domain> TXT record, returning all tags. Use to audit email authentication policy, verify the p (policy) and rua (reporting) settings, or confirm alignment mode; pair with dossier_spf and dossier_dkim for complete email-auth coverage. Queries _dmarc.<domain> via Cloudflare DoH (1.1.1.1), 5 s timeout; parses each tag=value pair. Returns a CheckResult: on success, {status:"ok", raw, tags:{p, rua, ruf, adkim, aspf,...}}; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await dmarcCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_dkim",
    slug: "dkim-lookup",
    description:
      'Probe a domain\'s DKIM public keys by querying <selector>._domainkey.<domain> for each selector. Use to verify signing configuration or discover active selectors; supply selectors when you know the ESP\'s selector, or omit to probe six common selectors (default, google, k1, selector1, selector2, mxvault). Issues parallel Cloudflare DoH (1.1.1.1) TXT queries per selector, 5 s timeout each. Returns a CheckResult: {status:"ok", found:[{selector, publicKey, raw},...], notFound:[...]} or {status:"error", reason}.',
    inputSchema: {
      domain: z.string().describe(DOMAIN_DESCRIBE),
      selectors: z
        .array(z.string())
        .optional()
        .describe(
          'DKIM selector names to probe, e.g. ["google", "s1"]. Omit to probe the built-in common-selectors set: default, google, k1, selector1, selector2, mxvault.',
        ),
    },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const sel = (input as { selectors?: unknown }).selectors;
      const selectors =
        Array.isArray(sel) && sel.every((s) => typeof s === "string")
          ? (sel as string[])
          : undefined;
      const r = await dkimCheck(domain, selectors ? { selectors } : {});
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_tls",
    slug: "tls-certificate-checker",
    description:
      'Fetch and inspect the TLS certificate presented by a domain on port 443, returning chain details and validity period. Use to verify certificate expiry, issuer, Subject Alternative Names, or detect mismatched or self-signed certs; not a full cipher-suite scanner. Performs a TLS handshake from the server edge, 5 s timeout; extracts the leaf certificate. Returns a CheckResult: on success, {status:"ok", subject, issuer, validFrom, validTo, daysRemaining, sans, fingerprint}; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await tlsCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_redirects",
    slug: "redirect-checker",
    description:
      'Trace the full HTTP redirect chain starting from https://<domain>/, recording each hop\'s status code and destination URL. Use to debug redirect loops, verify HTTP→HTTPS upgrades, or audit link shorteners; stops at 10 hops to prevent infinite loops. Follows Location headers with fetch (no auto-redirect), 5 s per hop. Returns a CheckResult: on success, {status:"ok", hops:[{url, statusCode, redirectsTo},...], final}; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await redirectsCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_headers",
    slug: "security-headers-checker",
    description:
      'Fetch https://<domain>/ and return all HTTP response headers, with an audit highlighting missing or misconfigured security headers. Use to review CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy; for redirect tracing use dossier_redirects instead. Single GET via fetch, 5 s timeout, captures raw response headers before any redirect is followed. Returns a CheckResult: on success, {status:"ok", headers:{...}, securityAudit:[{header, present, value},...]}; on failure, {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await headersCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_cors",
    slug: "cors-checker",
    description:
      'Send a CORS preflight OPTIONS request to https://<domain>/ and return the access-control-* response headers. Use to verify CORS policy for a specific origin-method pair, or to check whether a domain allows cross-origin requests; provide origin and method to simulate a precise preflight, or omit to use defaults (origin: https://drwho.me, method: GET). Single OPTIONS request via fetch, 5 s timeout. Returns a CheckResult: on success, {status:"ok", headers:{access-control-allow-origin,...}}; on failure, {status:"error", reason}.',
    inputSchema: {
      domain: z.string().describe(DOMAIN_DESCRIBE),
      origin: z
        .string()
        .optional()
        .describe(
          "Origin header value to include in the preflight, e.g. https://app.example.com. Defaults to https://drwho.me if omitted.",
        ),
      method: z
        .string()
        .optional()
        .describe(
          "Access-Control-Request-Method header value, e.g. POST or PUT. Defaults to GET if omitted.",
        ),
    },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const origin = (input as { origin?: string }).origin;
      const method = (input as { method?: string }).method;
      const r = await corsCheck(domain, { origin, method });
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "dossier_web_surface",
    slug: "web-surface-inspector",
    description:
      'Snapshot a domain\'s public web surface: robots.txt, sitemap.xml, and the home-page <head> metadata (title, description, OpenGraph, Twitter cards). Use for SEO audits, content discovery, or verifying metadata before sharing; for HTTP headers use dossier_headers, for redirect behavior use dossier_redirects. Fetches /, /robots.txt, and /sitemap.xml concurrently via HTTPS, 5 s each; parses <head> with a lightweight HTML parser. Returns a composite CheckResult: {status:"ok", meta:{title, description, og, twitter}, robots, sitemapPresent} or {status:"error", reason}.',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await webSurfaceCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "user_agent_parse",
    slug: "user-agent",
    description:
      "Parse a User-Agent header string into structured browser, OS, device type, and rendering-engine components. Use to identify client capabilities from a raw UA string, e.g. when analysing server logs or request headers; does not perform any network lookups — entirely local parsing. Runs synchronously using the ua-parser-js library with no external calls. Returns a JSON object with browser.name, browser.version, os.name, os.version, device.type, device.vendor, and engine.name fields; unknown fields are empty strings.",
    inputSchema: {
      ua: z
        .string()
        .describe(
          'Full User-Agent header value as sent by the browser or HTTP client, e.g. "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36".',
        ),
    },
    handler: async (input) => {
      const ua = String((input as { ua?: string }).ua ?? "");
      return ok(JSON.stringify(parseUserAgent(ua), null, 2));
    },
  },
  {
    name: "json_format",
    slug: "json",
    description:
      "Validate and pretty-print a JSON string at a configurable indent width (2 or 4 spaces). Use to detect parse errors in raw JSON or to normalize minified JSON for readability; for schema validation or data transformation, apply your own logic. Runs JSON.parse + JSON.stringify locally with no network calls. On success, returns the formatted JSON string. On parse failure, returns an error message describing the position and nature of the syntax error.",
    inputSchema: {
      input: z
        .string()
        .describe(
          "Raw JSON text to validate and format. May be minified or already pretty-printed.",
        ),
      indent: z
        .union([z.literal(2), z.literal(4)])
        .optional()
        .describe("Indentation width in spaces. Accepts 2 or 4; defaults to 2 if omitted."),
    },
    handler: async (input) => {
      const { input: raw, indent } = input as { input: string; indent?: 2 | 4 };
      const r = formatJson(raw, indent ?? 2);
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "base64_encode",
    slug: "base64",
    description:
      "Encode a UTF-8 plaintext string to standard Base64 (RFC 4648 §4, +/= alphabet). Use when you need to embed binary-safe text in HTTP headers, data URIs, or JSON payloads; note this tool uses the standard alphabet — replace + with - and / with _ manually if URL-safe Base64 is required. Pure local encoding with no network calls. Returns the Base64-encoded string as plain text. Always succeeds for valid UTF-8 input.",
    inputSchema: {
      input: z
        .string()
        .describe('UTF-8 plaintext string to encode, e.g. "Hello, world!" or binary-safe data.'),
    },
    handler: async (input) => {
      const r = encodeBase64(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "base64_decode",
    slug: "base64",
    description:
      "Decode a Base64 or Base64url string back to its original UTF-8 plaintext. Use to inspect encoded payloads, credentials, or embedded data; accepts both standard (+/) and URL-safe (-_) alphabets, with or without trailing = padding. Pure local decode with no network calls; validates that the result is valid UTF-8. Returns the decoded string on success. On failure (invalid Base64 or non-UTF-8 bytes), returns an error message describing what went wrong.",
    inputSchema: {
      input: z
        .string()
        .describe(
          "Base64 or Base64url encoded string to decode. Trailing = padding is optional. Both standard (+/) and URL-safe (-_) alphabets are accepted.",
        ),
    },
    handler: async (input) => {
      const r = decodeBase64(String((input as { input?: string }).input ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "url_encode",
    slug: "url-codec",
    description:
      "Percent-encode an arbitrary string so it is safe to embed as a URL component (query value, path segment, or fragment). Use to escape characters like &, =, #, spaces, and non-ASCII before appending to a URL; uses encodeURIComponent semantics, so / is encoded — do not pass a full URL, only the component that needs escaping. Pure local transform with no network calls. Returns the percent-encoded string as plain text. Always succeeds.",
    inputSchema: {
      input: z
        .string()
        .describe(
          'String to percent-encode, e.g. a query parameter value like "hello world" or "a=b&c=d". Pass only the component, not the full URL.',
        ),
    },
    handler: async (input) => {
      const r = encodeUrl(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "url_decode",
    slug: "url-codec",
    description:
      "Decode a percent-encoded URL component back to its original string. Use to read query parameters, path segments, or form-encoded values containing %XX sequences; accepts both +-as-space (form encoding) and %20 representations. Pure local decode via decodeURIComponent with no network calls. Returns the decoded string on success. On failure (malformed %XX sequence or invalid UTF-8), returns an error message describing the problem.",
    inputSchema: {
      input: z
        .string()
        .describe(
          'Percent-encoded string to decode, e.g. "hello%20world" or "a%3Db%26c%3Dd". Pass only the encoded component, not a full URL.',
        ),
    },
    handler: async (input) => {
      const r = decodeUrl(String((input as { input?: string }).input ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "jwt_decode",
    slug: "jwt",
    description:
      'Decode a JWT (JSON Web Token) into its header, payload, and raw signature without verifying the cryptographic signature. Use to inspect token claims (sub, exp, iat, aud, etc.) or debug auth flows; do NOT use the decoded claims for access-control decisions since the signature is not validated. Splits on ".", base64url-decodes each segment, and JSON-parses header and payload — no network calls, no key lookup. Returns JSON with header, payload, and signature fields. On malformed input, returns an error message.',
    inputSchema: {
      token: z
        .string()
        .describe(
          "JWT compact serialization — three base64url segments separated by dots (xxxxx.yyyyy.zzzzz). Bearer prefix must be removed before passing.",
        ),
    },
    handler: async (input) => {
      const r = decodeJwt(String((input as { token?: string }).token ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(
        JSON.stringify({ header: r.header, payload: r.payload, signature: r.signature }, null, 2),
      );
    },
  },
  {
    name: "uuid_generate",
    slug: "uuid",
    description:
      "Generate a single UUID in either v4 (random) or v7 (time-ordered, Unix-ms prefix) format. Use v4 for general-purpose identifiers; use v7 when UUIDs must sort chronologically by creation time (e.g. database primary keys or distributed tracing). Both versions use cryptographically random bits in their non-timestamp positions. Uses Node.js crypto.randomUUID() for v4 and a spec-compliant implementation for v7; no network calls. Returns a UUID string in canonical xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx format.",
    inputSchema: {
      version: z
        .enum(["v4", "v7"])
        .describe(
          "UUID version to generate. v4: fully random (RFC 4122 §4.4). v7: time-ordered with Unix-ms prefix for database-friendly sorting (draft-peabody-dispatch-new-uuid-format).",
        ),
    },
    handler: async (input) => {
      const version = (input as { version: "v4" | "v7" }).version;
      return ok(generateUuid(version));
    },
  },
  {
    name: "dossier_full",
    slug: "dossier-full",
    description:
      'Run all 10 Domain Dossier checks — dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, web-surface — in parallel and return all results in a single response. Use when you need a comprehensive domain health snapshot in one call; counts as ONE paywall call regardless of how many checks run. For a single focused check, prefer the individual dossier_* tools to minimise latency. Fires all 10 checks concurrently via Cloudflare DoH or direct HTTPS, 5 s per-check timeout. Returns a JSON object keyed by check id (dns, mx, etc.), each value a CheckResult discriminated union ({status:"ok",...} or {status:"error", reason}).',
    inputSchema: { domain: z.string().describe(DOMAIN_DESCRIBE) },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const results = await Promise.all(
        dossierChecks.map(async (c) => [c.id, await c.run(domain)] as const),
      );
      const payload: Record<string, unknown> = {};
      for (const [id, r] of results) payload[id] = r;
      return ok(JSON.stringify(payload, null, 2));
    },
  },
];

function withDenylist(tool: McpTool): McpTool {
  return {
    ...tool,
    handler: async (input) => {
      const domain = (input as { domain?: unknown }).domain;
      if (typeof domain === "string") {
        const r = isDenied(domain);
        if (r.denied) return fail(r.reason);
      }
      return tool.handler(input);
    },
  };
}

const DENYLIST_GATED = new Set([
  "dossier_dns",
  "dossier_mx",
  "dossier_spf",
  "dossier_dmarc",
  "dossier_dkim",
  "dossier_tls",
  "dossier_redirects",
  "dossier_headers",
  "dossier_cors",
  "dossier_web_surface",
  "dossier_full",
]);

function withTracking(tool: McpTool): McpTool {
  return {
    ...tool,
    handler: async (input) => {
      const result = await tool.handler(input);
      void sendMcpEvent({ name: tool.name, success: !result.isError });
      return result;
    },
  };
}

export const mcpTools: McpTool[] = rawMcpTools.map((t) =>
  withTracking(DENYLIST_GATED.has(t.name) ? withDenylist(t) : t),
);

export function findMcpTool(name: string): McpTool | undefined {
  return mcpTools.find((t) => t.name === name);
}
