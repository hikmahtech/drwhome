import {
  dkimCheck,
  dmarcCheck,
  dnsCheck,
  dnssecCheck,
  mxCheck,
  spfCheck,
  tlsrptCheck,
} from "@hikmahtech/dossier-checks";
import { checkBlacklists } from "../lib/blacklist";
import { blacklistReport } from "../reports/blacklist";
import { dkimRows } from "../reports/dkim";
import { dmarcRows } from "../reports/dmarc";
import { dnsRows } from "../reports/dns";
import { dnssecRows } from "../reports/dnssec";
import { mxRows } from "../reports/mx";
import { gradedReport } from "../reports/report";
import { spfRows } from "../reports/spf";
import { tlsrptRows } from "../reports/tlsrpt";
import type { DomainCheck } from "./types";

/**
 * Checks that need nothing but public, CORS-enabled APIs (Cloudflare DNS-over-HTTPS, crt.sh,
 * RDAP). They run in the visitor's browser. The server imports this list too, for MCP.
 * Nothing in this file may import a server-only module.
 */
export const browserChecks: DomainCheck[] = [
  {
    id: "spf-checker",
    run: async (d) => gradedReport("spf", await spfCheck(d), d, spfRows),
  },
  {
    id: "dmarc-checker",
    run: async (d) => gradedReport("dmarc", await dmarcCheck(d), d, dmarcRows),
  },
  {
    id: "dkim-lookup",
    run: async (d) => gradedReport("dkim", await dkimCheck(d), d, dkimRows),
  },
  {
    id: "tlsrpt-checker",
    run: async (d) => gradedReport("tlsrpt", await tlsrptCheck(d), d, tlsrptRows),
  },
  {
    id: "dns-records-lookup",
    run: async (d) => gradedReport("dns", await dnsCheck(d), d, dnsRows),
  },
  {
    id: "mx-lookup",
    run: async (d) => gradedReport("mx", await mxCheck(d), d, mxRows),
  },
  {
    id: "dnssec-checker",
    run: async (d) => gradedReport("dnssec", await dnssecCheck(d), d, dnssecRows),
  },
  {
    id: "blacklist-check",
    run: async (d) => blacklistReport(await checkBlacklists(d)),
  },
];
