import { Base64 } from "@/components/tools/Base64";
import { Dns } from "@/components/tools/Dns";
import { DossierDmarc } from "@/components/tools/DossierDmarc";
import { DossierDns } from "@/components/tools/DossierDns";
import { DossierMx } from "@/components/tools/DossierMx";
import { DossierSpf } from "@/components/tools/DossierSpf";
import { Headers } from "@/components/tools/Headers";
import { IpLookup } from "@/components/tools/IpLookup";
import { Json } from "@/components/tools/Json";
import { Jwt } from "@/components/tools/Jwt";
import { UrlCodec } from "@/components/tools/UrlCodec";
import { UserAgent } from "@/components/tools/UserAgent";
import { Uuid } from "@/components/tools/Uuid";
import { WhatIsMyIp } from "@/components/tools/WhatIsMyIp";
import type { ComponentType } from "react";

export type ToolCategory = "network" | "dev";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  component: ComponentType<{ domain?: string }>;
  /**
   * MCP tool name(s) that map to this web tool. Undefined = not MCP-exposed.
   * Multiple entries for tools that expose >1 MCP function (e.g. base64 has encode + decode).
   */
  mcpNames?: readonly string[];
};

export const tools: Tool[] = [
  {
    slug: "base64",
    name: "base64",
    description: "encode and decode base64 strings (client-side, unicode-safe).",
    category: "dev",
    keywords: ["base64", "encode", "decode", "encoder", "decoder"],
    component: Base64,
    mcpNames: ["base64_encode", "base64_decode"],
  },
  {
    slug: "json",
    name: "json",
    description: "format and validate JSON. 2 / 4 space or minified output.",
    category: "dev",
    keywords: ["json", "format", "prettify", "validate", "minify"],
    component: Json,
    mcpNames: ["json_format"],
  },
  {
    slug: "url-codec",
    name: "url codec",
    description: "percent-encode and decode URL components.",
    category: "dev",
    keywords: ["url", "encode", "decode", "percent", "encodeURIComponent"],
    component: UrlCodec,
    mcpNames: ["url_encode", "url_decode"],
  },
  {
    slug: "uuid",
    name: "uuid",
    description: "generate UUIDs (v4 random, v7 time-ordered).",
    category: "dev",
    keywords: ["uuid", "guid", "v4", "v7", "random", "identifier"],
    component: Uuid,
    mcpNames: ["uuid_generate"],
  },
  {
    slug: "jwt",
    name: "jwt decoder",
    description: "decode JWT header and payload client-side. no signature verification.",
    category: "dev",
    keywords: ["jwt", "decode", "token", "bearer", "auth"],
    component: Jwt,
    mcpNames: ["jwt_decode"],
  },
  {
    slug: "user-agent",
    name: "user agent",
    description: "parse your browser's user agent string (browser, os, device, engine).",
    category: "network",
    keywords: ["user agent", "ua", "browser", "os", "device"],
    component: UserAgent,
    mcpNames: ["user_agent_parse"],
  },
  {
    slug: "ip",
    name: "what is my ip",
    description: "your public ip address, location, and timezone.",
    category: "network",
    keywords: ["ip", "ipv4", "ipv6", "location", "geoip", "whatsmyip"],
    component: WhatIsMyIp,
  },
  {
    slug: "headers",
    name: "http headers",
    description: "inspect the http request headers your browser sends.",
    category: "network",
    keywords: ["http", "headers", "request", "user-agent", "accept"],
    component: Headers,
  },
  {
    slug: "ip-lookup",
    name: "ip lookup",
    description: "look up any IP's geolocation, ASN, and ISP (via ipinfo.io).",
    category: "network",
    keywords: ["ip", "lookup", "geoip", "asn", "isp", "ipinfo"],
    component: IpLookup,
    mcpNames: ["ip_lookup"],
  },
  {
    slug: "dns",
    name: "dns lookup",
    description: "resolve A, AAAA, MX, TXT, NS, or CNAME records via Cloudflare DoH.",
    category: "network",
    keywords: ["dns", "lookup", "record", "A", "AAAA", "MX", "TXT", "cloudflare"],
    component: Dns,
    mcpNames: ["dns_lookup"],
  },
  {
    slug: "dossier-dns",
    name: "dossier / dns",
    description: "resolve A, AAAA, NS, SOA, CAA, and TXT records for a domain in one go.",
    category: "network",
    keywords: ["dns", "dossier", "records", "soa", "caa", "nameserver"],
    component: DossierDns,
    mcpNames: ["dossier_dns"],
  },
  {
    slug: "dossier-mx",
    name: "dossier / mx",
    description: "list the mail exchangers (MX records) a domain advertises, sorted by priority.",
    category: "network",
    keywords: ["mx", "mail", "dossier", "exchange", "email", "smtp"],
    component: DossierMx,
    mcpNames: ["dossier_mx"],
  },
  {
    slug: "dossier-spf",
    name: "dossier / spf",
    description: "find and parse a domain's SPF (sender policy framework) record.",
    category: "network",
    keywords: ["spf", "dossier", "email", "authentication", "sender"],
    component: DossierSpf,
    mcpNames: ["dossier_spf"],
  },
  {
    slug: "dossier-dmarc",
    name: "dossier / dmarc",
    description: "find and parse a domain's DMARC policy record at _dmarc.<domain>.",
    category: "network",
    keywords: ["dmarc", "dossier", "email", "authentication", "policy"],
    component: DossierDmarc,
    mcpNames: ["dossier_dmarc"],
  },
];

export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
