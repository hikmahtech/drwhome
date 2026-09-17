import type { WhoisCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

const MS_PER_DAY = 86_400_000;

export function whoisRows(d: WhoisCheckData): Row[] {
  const expiresMs = d.expiresAt ? new Date(d.expiresAt).getTime() : Number.NaN;
  const days = Number.isFinite(expiresMs)
    ? Math.floor((expiresMs - Date.now()) / MS_PER_DAY)
    : undefined;

  const rows: Row[] = [
    { label: "Registrar", value: d.registrar ?? "unknown" },
    { label: "Created", value: d.createdAt ?? "unknown" },
    {
      label: "Expires",
      value: d.expiresAt ?? "unknown",
      tone:
        days !== undefined && days < 0 ? "bad" : days !== undefined && days < 30 ? "warn" : "plain",
    },
  ];
  if (d.statuses.length > 0) {
    rows.push({ label: `Status (${d.statuses.length})`, value: d.statuses.join("\n") });
  }
  const source =
    d.raw && typeof d.raw === "object" && (d.raw as Record<string, unknown>).source === "rdap"
      ? "RDAP"
      : "WHOIS";
  rows.push({ label: "Source", value: source });
  return rows;
}
