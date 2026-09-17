import type { DnssecCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function dnssecRows({ dnssecEnabled, adFlag, ds, dnskey }: DnssecCheckData): Row[] {
  const rows: Row[] = [
    {
      label: "DNSSEC",
      value: dnssecEnabled ? "Enabled" : "Not enabled",
      tone: dnssecEnabled ? "good" : "plain",
    },
    {
      label: "Validation (AD flag)",
      value: adFlag ? "Yes" : "No",
      note: "Set by the resolver once it has checked the DNSSEC signature chain.",
    },
  ];
  if (ds.length > 0)
    rows.push({ label: `DS (${ds.length})`, value: ds.map((r) => r.data).join("\n") });
  if (dnskey.length > 0)
    rows.push({ label: `DNSKEY (${dnskey.length})`, value: dnskey.map((r) => r.data).join("\n") });
  return rows;
}
