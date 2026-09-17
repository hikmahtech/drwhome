import {
  aiCrawlerPolicyCheck,
  corsCheck,
  ctLogCheck,
  headersCheck,
  llmsTxtCheck,
  mcpEndpointCheck,
  mtaStsCheck,
  redirectsCheck,
  securityTxtCheck,
  tlsCheck,
  webSurfaceCheck,
  whoisCheck,
} from "@hikmahtech/dossier-checks";
import { aiCrawlerRows } from "../reports/ai-crawlers";
import { corsRows } from "../reports/cors";
import { ctLogRows } from "../reports/ct-log";
import { llmsTxtRows } from "../reports/llms-txt";
import { mcpEndpointReport } from "../reports/mcp-endpoint";
import { mtaStsRows } from "../reports/mta-sts";
import { redirectsRows } from "../reports/redirects";
import { gradedReport } from "../reports/report";
import { securityHeadersRows } from "../reports/security-headers";
import { securityTxtRows } from "../reports/security-txt";
import { tlsRows } from "../reports/tls";
import { webSurfaceRows } from "../reports/web-surface";
import { whoisRows } from "../reports/whois";
import { browserChecks } from "./browser";
import type { DomainCheck } from "./types";

/**
 * Checks that must run on the server: they read another site's response, which a browser may
 * not do across origins, or they need a raw socket. Every one is called through guardedRun
 * (src/server/ssrf.ts), never directly.
 */
export const serverOnlyChecks: DomainCheck[] = [
  {
    // On the server although both sources allow cross-origin GETs: crt.sh rejects the browser's
    // preflight, and the package's certspotter fallback reads process.env.
    id: "ct-log-lookup",
    run: async (d) => gradedReport("ct_log", await ctLogCheck(d), d, ctLogRows),
  },
  {
    id: "security-headers-checker",
    run: async (d) => gradedReport("headers", await headersCheck(d), d, securityHeadersRows),
  },
  {
    id: "tls-certificate-checker",
    run: async (d) => gradedReport("tls", await tlsCheck(d), d, tlsRows),
  },
  {
    id: "redirect-checker",
    run: async (d) => gradedReport("redirects", await redirectsCheck(d), d, redirectsRows),
  },
  {
    id: "cors-checker",
    run: async (d) => gradedReport("cors", await corsCheck(d), d, corsRows),
  },
  {
    id: "web-surface-inspector",
    run: async (d) => gradedReport("web-surface", await webSurfaceCheck(d), d, webSurfaceRows),
  },
  {
    id: "ai-crawler-checker",
    run: async (d) => gradedReport("ai-crawlers", await aiCrawlerPolicyCheck(d), d, aiCrawlerRows),
  },
  {
    id: "llms-txt-checker",
    run: async (d) => gradedReport("llms-txt", await llmsTxtCheck(d), d, llmsTxtRows),
  },
  {
    id: "security-txt-checker",
    run: async (d) => gradedReport("security-txt", await securityTxtCheck(d), d, securityTxtRows),
  },
  {
    id: "mta-sts-checker",
    run: async (d) => gradedReport("mta_sts", await mtaStsCheck(d), d, mtaStsRows),
  },
  {
    id: "whois-lookup",
    run: async (d) => gradedReport("whois", await whoisCheck(d), d, whoisRows),
  },
  {
    id: "mcp-endpoint-checker",
    // mcpEndpointCheck takes a full endpoint URL, not a domain, and the package defines no
    // discovery convention for turning a bare domain into one. We probe https://<domain>/mcp —
    // the path this project's own MCP server and Domain Posture's AI-surface scan both treat as
    // the conventional location for a remote MCP server. Said plainly in the tool's prose.
    run: async (d) => {
      const probedUrl = `https://${d}/mcp`;
      return mcpEndpointReport(await mcpEndpointCheck(probedUrl), probedUrl);
    },
  },
];

export const allChecks: DomainCheck[] = [...browserChecks, ...serverOnlyChecks];
export const findCheck = (id: string): DomainCheck | undefined =>
  allChecks.find((c) => c.id === id);
export const isServerOnly = (id: string): boolean => serverOnlyChecks.some((c) => c.id === id);
