import type { CheckResult } from "@/lib/dossier/types";
import { dnsCheck } from "@/lib/dossier/checks/dns";

export type DossierCheckId = "dns";

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string; // matches content/tools.ts slug
  run: (domain: string) => Promise<CheckResult<unknown>>;
};

export const dossierChecks: DossierCheck[] = [
  { id: "dns", title: "dns", toolSlug: "dossier-dns", run: dnsCheck },
];

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}
