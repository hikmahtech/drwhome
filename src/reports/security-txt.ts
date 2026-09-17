import type { SecurityTxtCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function securityTxtRows(d: SecurityTxtCheckData): Row[] {
  const rows: Row[] = [
    { label: `Contact (${d.contact.length})`, value: d.contact.join("\n") || "none" },
  ];
  if (d.expires) rows.push({ label: "Expires", value: d.expires });
  return rows;
}
