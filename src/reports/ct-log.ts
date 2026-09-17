import type { CtLogCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

// The package caps subdomains at 100 (SUB_CAP in ct_log.ts) but does not export the
// constant, so it is repeated here only to decide when to add the "capped" note.
const SUB_CAP = 100;

export function ctLogRows({ subdomains, wildcards, certCount }: CtLogCheckData): Row[] {
  const capped = subdomains.length >= SUB_CAP;
  const rows: Row[] = [
    {
      label: `Subdomains (${subdomains.length}${capped ? "+" : ""})`,
      value: subdomains.length > 0 ? subdomains.join("\n") : "none found",
      note: capped ? `Capped at ${SUB_CAP}. There may be more.` : undefined,
    },
  ];
  if (wildcards.length > 0)
    rows.push({
      label: `Wildcard certificates (${wildcards.length})`,
      value: wildcards.join("\n"),
    });
  rows.push({ label: "Certificates seen", value: String(certCount) });
  return rows;
}
