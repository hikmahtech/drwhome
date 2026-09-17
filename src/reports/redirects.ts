import type { RedirectsCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function redirectsRows(d: RedirectsCheckData): Row[] {
  const rows: Row[] = d.hops.map((hop, i) => ({
    label: i === d.hops.length - 1 ? "Final" : `Hop ${i + 1}`,
    value: `${hop.status}  ${hop.url}`,
  }));
  return rows;
}
