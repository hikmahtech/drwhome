import type { CorsCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

export function corsRows(d: CorsCheckData): Row[] {
  const rows: Row[] = [
    { label: "Origin sent", value: d.origin },
    { label: "Method requested", value: d.method },
    { label: "Preflight status", value: String(d.preflightStatus) },
  ];

  if (!d.anyAcHeader) {
    rows.push({ label: "Access-Control-Allow-Origin", value: "not sent", tone: "plain" });
    return rows;
  }

  rows.push({ label: "Access-Control-Allow-Origin", value: d.allowOrigin ?? "not sent" });
  if (d.allowMethods) rows.push({ label: "Access-Control-Allow-Methods", value: d.allowMethods });
  if (d.allowHeaders) rows.push({ label: "Access-Control-Allow-Headers", value: d.allowHeaders });
  if (d.allowCredentials) {
    rows.push({ label: "Access-Control-Allow-Credentials", value: d.allowCredentials });
  }
  if (d.maxAge) rows.push({ label: "Access-Control-Max-Age", value: d.maxAge });
  if (d.exposeHeaders) {
    rows.push({ label: "Access-Control-Expose-Headers", value: d.exposeHeaders });
  }

  const wildcardWithCreds =
    d.allowOrigin === "*" && (d.allowCredentials ?? "").trim().toLowerCase() === "true";
  if (wildcardWithCreds) {
    rows.push({
      label: "Note",
      value: "Allow-Origin: * together with Allow-Credentials: true",
      note: "Browsers refuse this combination and block the request, so nothing gets through today. It still means the CORS policy is misconfigured and should name real origins instead of *.",
      tone: "bad",
    });
  }
  return rows;
}
