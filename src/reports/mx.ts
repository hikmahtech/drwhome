import type { MxCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function mxRows({ records }: MxCheckData): Row[] {
  return [
    {
      label: `Mail servers (${records.length})`,
      value: records.map((r) => `${r.priority} ${r.exchange}`).join("\n"),
      note: "Lowest priority number is tried first.",
    },
  ];
}
