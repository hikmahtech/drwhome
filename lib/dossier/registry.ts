import { corsCheck } from "@/lib/dossier/checks/cors";
import { dkimCheck } from "@/lib/dossier/checks/dkim";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { headersCheck } from "@/lib/dossier/checks/headers";
import { mxCheck } from "@/lib/dossier/checks/mx";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";
import { spfCheck } from "@/lib/dossier/checks/spf";
import { tlsCheck } from "@/lib/dossier/checks/tls";
import type { CheckResult } from "@/lib/dossier/types";

export type DossierCheckId =
  | "dns"
  | "mx"
  | "spf"
  | "dmarc"
  | "dkim"
  | "tls"
  | "redirects"
  | "headers"
  | "cors";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string; // matches content/tools.ts slug
  run: (domain: string) => Promise<CheckResult<unknown>>;
};

export const dossierChecks: DossierCheck[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", run: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "dossier-mx", run: mxCheck },
  { id: "spf", title: "spf", toolSlug: "dossier-spf", run: spfCheck },
  { id: "dmarc", title: "dmarc", toolSlug: "dossier-dmarc", run: dmarcCheck },
  { id: "dkim", title: "dkim", toolSlug: "dossier-dkim", run: dkimCheck },
  { id: "tls", title: "tls", toolSlug: "dossier-tls", run: tlsCheck },
  {
    id: "redirects",
    title: "redirects",
    toolSlug: "dossier-redirects",
    run: redirectsCheck,
  },
  {
    id: "headers",
    title: "headers",
    toolSlug: "dossier-headers",
    run: headersCheck,
  },
  { id: "cors", title: "cors", toolSlug: "dossier-cors", run: corsCheck },
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
