import { Base64 } from "@/components/tools/Base64";
import { Headers } from "@/components/tools/Headers";
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
  component: ComponentType;
};

export const tools: Tool[] = [
  {
    slug: "base64",
    name: "base64",
    description: "encode and decode base64 strings (client-side, unicode-safe).",
    category: "dev",
    keywords: ["base64", "encode", "decode", "encoder", "decoder"],
    component: Base64,
  },
  {
    slug: "json",
    name: "json",
    description: "format and validate JSON. 2 / 4 space or minified output.",
    category: "dev",
    keywords: ["json", "format", "prettify", "validate", "minify"],
    component: Json,
  },
  {
    slug: "url-codec",
    name: "url codec",
    description: "percent-encode and decode URL components.",
    category: "dev",
    keywords: ["url", "encode", "decode", "percent", "encodeURIComponent"],
    component: UrlCodec,
  },
  {
    slug: "uuid",
    name: "uuid",
    description: "generate UUIDs (v4 random, v7 time-ordered).",
    category: "dev",
    keywords: ["uuid", "guid", "v4", "v7", "random", "identifier"],
    component: Uuid,
  },
  {
    slug: "jwt",
    name: "jwt decoder",
    description: "decode JWT header and payload client-side. no signature verification.",
    category: "dev",
    keywords: ["jwt", "decode", "token", "bearer", "auth"],
    component: Jwt,
  },
  {
    slug: "user-agent",
    name: "user agent",
    description: "parse your browser's user agent string (browser, os, device, engine).",
    category: "network",
    keywords: ["user agent", "ua", "browser", "os", "device"],
    component: UserAgent,
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
];

export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
