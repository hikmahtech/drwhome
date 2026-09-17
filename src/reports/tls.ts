import type { TlsCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

const MS_PER_DAY = 86_400_000;

function fmtName(n: { CN?: string; O?: string }): string {
  const parts = [n.CN, n.O].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : "unknown";
}

export function tlsRows(d: TlsCheckData): Row[] {
  const validToMs = new Date(d.validTo).getTime();
  const days = Number.isFinite(validToMs)
    ? Math.floor((validToMs - Date.now()) / MS_PER_DAY)
    : undefined;
  const expired = days !== undefined && days < 0;

  const rows: Row[] = [
    { label: "Subject", value: fmtName(d.subject) },
    { label: "Issuer", value: fmtName(d.issuer) },
    { label: "Valid from", value: d.validFrom || "unknown" },
    { label: "Valid to", value: d.validTo || "unknown" },
    {
      label: "Days remaining",
      value:
        days === undefined
          ? "unknown"
          : expired
            ? `expired ${Math.abs(days)} day(s) ago`
            : String(days),
      tone: expired ? "bad" : days !== undefined && days < 30 ? "warn" : "plain",
    },
  ];
  if (d.sans.length > 0) {
    rows.push({ label: `Names on the certificate (${d.sans.length})`, value: d.sans.join("\n") });
  }
  if (d.fingerprint256) {
    rows.push({ label: "SHA-256 fingerprint", value: d.fingerprint256 });
  }
  rows.push({
    label: "Chain",
    value: d.authorized
      ? "validated"
      : `not validated${d.authorizationError ? `: ${d.authorizationError}` : ""}`,
    tone: d.authorized ? "good" : "bad",
  });
  return rows;
}
