import { type SpfAll, buildSpfRecord } from "../lib/spf-generator";
import type { Report, Row } from "../reports/report";
import { defineLive } from "./_live";

function list(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

defineLive((f) => {
  const all = String(f.get("all") ?? "-all") as SpfAll;
  const { record, warnings, lookups } = buildSpfRecord({
    a: f.get("a") === "on",
    mx: f.get("mx") === "on",
    ip4: list(f.get("ip4")),
    ip6: list(f.get("ip6")),
    includes: list(f.get("includes")),
    all,
  });

  const rows: Row[] = [
    { label: "TXT record", value: record, note: "Add it to the domain's DNS as a TXT record." },
    {
      label: "DNS lookups",
      value: `${lookups} of 10`,
      tone: lookups > 10 ? "bad" : "plain",
    },
    ...warnings.map((w): Row => ({ label: "Warning", value: w, tone: "warn" })),
  ];
  const report: Report = { verdict: record, tone: warnings.length > 0 ? "warn" : "good", rows };
  return { report };
});
