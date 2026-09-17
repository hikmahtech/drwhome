import type { DmarcCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

function policyNote(value: string): string {
  switch (value.toLowerCase()) {
    case "reject":
      return "Mail that fails is blocked outright.";
    case "quarantine":
      return "Mail that fails is sent to spam.";
    case "none":
      return "Mail that fails is delivered anyway. Monitoring only, no enforcement.";
    default:
      return "Not one of the three standard values (none, quarantine, reject).";
  }
}

function alignmentNote(label: string, value: string): string {
  return value.toLowerCase() === "s"
    ? `Strict ${label} alignment: the signing domain must match exactly.`
    : `Relaxed ${label} alignment: a subdomain match is enough.`;
}

/** The policy tags a person reading a DMARC record actually cares about. */
export function dmarcRows({ record, tags }: DmarcCheckData): Row[] {
  const rows: Row[] = [{ label: "Record", value: record }];

  if (tags.p) rows.push({ label: "Policy (p)", value: tags.p, note: policyNote(tags.p) });
  if (tags.sp)
    rows.push({
      label: "Subdomain policy (sp)",
      value: tags.sp,
      note: `${policyNote(tags.sp)} Applies to subdomains only.`,
    });
  if (tags.pct)
    rows.push({
      label: "Percentage (pct)",
      value: tags.pct,
      note: "Only this share of mail that fails is subject to the policy above. Defaults to 100 when absent.",
    });
  if (tags.rua)
    rows.push({
      label: "Aggregate reports (rua)",
      value: tags.rua,
      note: "Daily summaries of who sends mail as this domain go here.",
    });
  if (tags.ruf)
    rows.push({
      label: "Forensic reports (ruf)",
      value: tags.ruf,
      note: "Per-message failure reports go here. Most receivers ignore this tag.",
    });
  if (tags.adkim)
    rows.push({
      label: "DKIM alignment (adkim)",
      value: tags.adkim,
      note: alignmentNote("DKIM", tags.adkim),
    });
  if (tags.aspf)
    rows.push({
      label: "SPF alignment (aspf)",
      value: tags.aspf,
      note: alignmentNote("SPF", tags.aspf),
    });

  return rows;
}
