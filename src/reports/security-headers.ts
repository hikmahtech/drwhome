import { type HeadersCheckData, SECURITY_HEADERS } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function securityHeadersRows({ finalUrl, headers }: HeadersCheckData): Row[] {
  const rows: Row[] = [{ label: "Fetched", value: finalUrl }];
  for (const name of SECURITY_HEADERS) {
    const value = headers[name];
    rows.push(
      value
        ? { label: name, value, tone: "good" }
        : { label: name, value: "not sent", tone: "warn" },
    );
  }
  const rest = Object.entries(headers)
    .filter(([k]) => !(SECURITY_HEADERS as readonly string[]).includes(k))
    .sort(([a], [b]) => a.localeCompare(b));
  if (rest.length > 0) {
    rows.push({
      label: `Other headers (${rest.length})`,
      value: rest.map(([k, v]) => `${k}: ${v}`).join("\n"),
    });
  }
  return rows;
}
