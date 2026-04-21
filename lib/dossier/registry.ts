import { dnsCheck } from "@/lib/dossier/checks/dns";
import { mxCheck } from "@/lib/dossier/checks/mx";
import type { CheckResult } from "@/lib/dossier/types";

export type DossierCheckId = "dns" | "mx";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string; // matches content/tools.ts slug
  run: (domain: string) => Promise<CheckResult<unknown>>;
};

export const dossierChecks: DossierCheck[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", run: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "dossier-mx", run: mxCheck },
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
