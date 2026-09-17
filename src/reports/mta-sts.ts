import type { MtaStsCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function mtaStsRows(d: MtaStsCheckData): Row[] {
  const rows: Row[] = [
    {
      label: "Mode",
      value: d.mode,
      tone: d.mode === "enforce" ? "good" : d.mode === "testing" ? "warn" : "bad",
    },
    { label: "Policy id", value: d.policyId },
    { label: "Max age", value: `${d.maxAge} seconds` },
  ];
  if (d.mx.length > 0) rows.push({ label: `MX allowed (${d.mx.length})`, value: d.mx.join("\n") });
  return rows;
}
