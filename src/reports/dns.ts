import { DNS_DOSSIER_TYPES, type DnsCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

function unquote(txt: string): string {
  return txt
    .split(/"\s*"/)
    .map((s) => s.replace(/^"|"$/g, ""))
    .join("");
}

/** One row per record type, values joined by newlines. Empty types are left out. */
export function dnsRows({ records }: DnsCheckData): Row[] {
  const rows: Row[] = [];
  for (const type of DNS_DOSSIER_TYPES) {
    const answers = records[type];
    if (!answers || answers.length === 0) continue;
    const values = answers.map((a) => (type === "TXT" ? unquote(a.data) : a.data));
    rows.push({ label: type, value: values.join("\n") });
  }
  return rows;
}
