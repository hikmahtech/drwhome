import { dkimCheck } from "@/lib/dossier/checks/dkim";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { mxCheck } from "@/lib/dossier/checks/mx";
import { spfCheck } from "@/lib/dossier/checks/spf";
import type { CheckResult } from "@/lib/dossier/types";

export type DossierCheckId = "dns" | "mx" | "spf" | "dmarc" | "dkim";

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
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
