import type { BlacklistResult } from "../lib/blacklist";
import type { Report, Row, Tone } from "./report";

/**
 * Blacklist has no Domain Posture rule slug, so the Report is built by hand instead of
 * going through gradedReport.
 */
export function blacklistReport(r: BlacklistResult): Report {
  if (!r.ok) {
    // "no A or MX records" is a finding about the domain (we looked and there is nothing
    // to check); anything else (invalid domain) is a genuine "could not tell".
    const nothingToCheck = /no a or mx/i.test(r.error);
    return {
      verdict: nothingToCheck ? "No web or mail address to check" : `Could not check: ${r.error}`,
      tone: nothingToCheck ? "warn" : "bad",
      rows: [],
    };
  }

  const distinctListed = new Set<string>();
  let unavailable = 0;
  for (const ip of r.ips) {
    for (const l of ip.listings) {
      if (l.status === "listed") distinctListed.add(l.list);
      if (l.status === "unavailable") unavailable++;
    }
  }

  let verdict: string;
  let tone: Tone;
  if (distinctListed.size > 0) {
    verdict = `Listed on ${distinctListed.size} blocklist(s)`;
    tone = "bad";
  } else if (unavailable > 0) {
    verdict = `Some blocklists could not be queried (${unavailable} check(s))`;
    tone = "warn";
  } else {
    verdict = `Not listed on any of ${r.checkedLists} blocklists`;
    tone = "good";
  }

  const rows: Row[] = r.ips.map((ip) => {
    const listed = ip.listings.filter((l) => l.status === "listed").map((l) => l.list);
    const ipUnavailable = ip.listings.filter((l) => l.status === "unavailable").length;
    const rowTone: Tone = listed.length > 0 ? "bad" : ipUnavailable > 0 ? "warn" : "good";
    const value =
      listed.length > 0
        ? listed.join(", ")
        : ipUnavailable > 0
          ? `${ipUnavailable} list(s) could not be queried`
          : "clean";
    return { label: `${ip.ip} (${ip.source})`, value, tone: rowTone };
  });

  return { verdict, tone, rows };
}
