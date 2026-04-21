import { sendMcpEvent } from "@/lib/analytics/server";
import { decodeBase64, encodeBase64 } from "@/lib/tools/base64";
import { DNS_TYPES, resolveDns } from "@/lib/tools/dns";
import { dnsCheck } from "@/lib/dossier/checks/dns";
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

const rawMcpTools: McpTool[] = [
  {
    name: "ip_lookup",
    slug: "ip-lookup",
    description:
      "Look up an IP address (v4 or v6) and return its geolocation, ASN, and ISP via ipinfo.io.",
    inputSchema: {
      ip: z.string().describe("IPv4 or IPv6 address to look up"),
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
    description: "Resolve a DNS record (A, AAAA, MX, TXT, NS, CNAME) via Cloudflare DoH.",
    inputSchema: {
      name: z.string().describe("Domain name to resolve"),
      type: z.enum(DNS_TYPES).describe("DNS record type"),
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
    slug: "dossier-dns",
    description:
      "Run the DNS section of the domain dossier: resolves A, AAAA, NS, SOA, CAA, TXT in parallel. Returns a CheckResult discriminated union.",
    inputSchema: {
      domain: z.string().describe("Public FQDN, e.g. example.com. IPs, ports, and paths rejected."),
    },
    handler: async (input) => {
      const domain = String((input as { domain?: string }).domain ?? "");
      const r = await dnsCheck(domain);
      return ok(JSON.stringify(r, null, 2));
    },
  },
  {
    name: "user_agent_parse",
    slug: "user-agent",
    description: "Parse a User-Agent string into browser, OS, device, and engine components.",
    inputSchema: {
      ua: z.string().describe("User-Agent header value"),
    },
    handler: async (input) => {
      const ua = String((input as { ua?: string }).ua ?? "");
      return ok(JSON.stringify(parseUserAgent(ua), null, 2));
    },
  },
  {
    name: "json_format",
    slug: "json",
    description: "Format and validate JSON. Returns the pretty-printed string or a parse error.",
    inputSchema: {
      input: z.string().describe("Raw JSON text"),
      indent: z
        .union([z.literal(2), z.literal(4)])
        .optional()
        .describe("Indent width; default 2"),
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
    description: "Encode a UTF-8 string as standard base64.",
    inputSchema: {
      input: z.string().describe("UTF-8 string to encode"),
    },
    handler: async (input) => {
      const r = encodeBase64(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "base64_decode",
    slug: "base64",
    description: "Decode a base64 (or base64url) string to UTF-8.",
    inputSchema: {
      input: z.string().describe("Base64 or base64url string"),
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
    description: "Percent-encode a string for use in a URL component.",
    inputSchema: {
      input: z.string().describe("String to encode"),
    },
    handler: async (input) => {
      const r = encodeUrl(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "url_decode",
    slug: "url-codec",
    description: "Decode a percent-encoded URL component.",
    inputSchema: {
      input: z.string().describe("Percent-encoded string"),
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
      "Decode a JWT into its header, payload, and signature parts. Does NOT verify the signature.",
    inputSchema: {
      token: z.string().describe("JWT compact serialization (three dot-separated segments)"),
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
    description: "Generate a v4 (random) or v7 (time-ordered) UUID.",
    inputSchema: {
      version: z.enum(["v4", "v7"]).describe("UUID version"),
    },
    handler: async (input) => {
      const version = (input as { version: "v4" | "v7" }).version;
      return ok(generateUuid(version));
    },
  },
];

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

export const mcpTools: McpTool[] = rawMcpTools.map(withTracking);

export function findMcpTool(name: string): McpTool | undefined {
  return mcpTools.find((t) => t.name === name);
}
