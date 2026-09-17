import { type DnsType, resolveDns } from "../lib/dns";
import type { Report, Row } from "../reports/report";
import { defineLive } from "./_live";

defineLive(async (f) => {
  const name = String(f.get("name") ?? "").trim();
  const type = String(f.get("type") ?? "A") as DnsType;
  if (!name) return null;

  const r = await resolveDns(name, type);
  if (!r.ok) return { error: r.error };

  if (r.answers.length === 0) {
    const report: Report = {
      verdict: `No ${type} records found for ${name}.`,
      tone: "warn",
      rows: [],
    };
    return { report };
  }

  const rows: Row[] = r.answers.map((a) => ({
    label: a.type,
    value: a.data,
    note: `TTL ${a.TTL}s${a.name.replace(/\.$/, "") !== name ? ` · ${a.name}` : ""}`,
  }));
  const report: Report = {
    verdict: `${r.answers.length} ${type} record${r.answers.length === 1 ? "" : "s"} for ${name}`,
    tone: "good",
    rows,
  };
  return { report };
});
