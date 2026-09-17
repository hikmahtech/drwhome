import { type DmarcPolicy, buildDmarcRecord } from "../lib/dmarc-generator";
import type { Report, Row } from "../reports/report";
import { defineLive } from "./_live";

defineLive((f) => {
  const domain = String(f.get("domain") ?? "").trim();
  const policy = String(f.get("policy") ?? "none") as DmarcPolicy;
  const sp = String(f.get("sp") ?? "");
  const pctRaw = String(f.get("pct") ?? "").trim();

  const { record, warnings } = buildDmarcRecord({
    policy,
    subdomainPolicy: sp === "" ? "" : (sp as DmarcPolicy),
    rua: String(f.get("rua") ?? ""),
    ruf: String(f.get("ruf") ?? ""),
    pct: pctRaw ? Number(pctRaw) : undefined,
    adkim: f.get("adkim") === "on" ? "s" : "r",
    aspf: f.get("aspf") === "on" ? "s" : "r",
  });

  const rows: Row[] = [
    { label: "DNS name", value: domain ? `_dmarc.${domain}` : "_dmarc.yourdomain.com" },
    { label: "TXT record", value: record },
    ...warnings.map((w): Row => ({ label: "Warning", value: w, tone: "warn" })),
  ];
  const report: Report = { verdict: record, tone: warnings.length > 0 ? "warn" : "good", rows };
  return { report };
});
