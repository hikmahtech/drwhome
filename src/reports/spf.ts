import type { SpfCheckData } from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

const COSTS_A_LOOKUP = /^[+\-~?]?(include:|a(:|\/|$)|mx(:|\/|$)|ptr|exists:|redirect=)/i;
const IS_ALL = /^[+\-~?]?all$/i;

export function spfRows({ record, mechanisms, lookalikes }: SpfCheckData): Row[] {
  const lookups = mechanisms.filter((m) => COSTS_A_LOOKUP.test(m)).length;
  const rows: Row[] = [
    { label: "Record", value: record },
    {
      label: "DNS lookups",
      value: `${lookups} of 10`,
      note:
        lookups > 10
          ? "Over the limit. Receivers return a permanent error and SPF fails."
          : "Counts this record only. Nested includes add their own lookups.",
      tone: lookups > 10 ? "bad" : "plain",
    },
  ];

  // Group the mechanisms by kind. One row each would bury the verdict under a long list.
  const body = mechanisms.slice(1).filter((m) => !IS_ALL.test(m));
  const kinds: [string, RegExp][] = [
    ["Includes", /^[+\-~?]?include:/i],
    ["Addresses", /^[+\-~?]?ip[46]:/i],
  ];
  for (const [label, re] of kinds) {
    const hit = body.filter((m) => re.test(m));
    if (hit.length > 0) rows.push({ label: `${label} (${hit.length})`, value: hit.join("\n") });
  }
  const other = body.filter((m) => !kinds.some(([, re]) => re.test(m)));
  if (other.length > 0) rows.push({ label: `Other (${other.length})`, value: other.join("\n") });

  for (const l of lookalikes ?? []) {
    rows.push({
      label: "Discarded",
      value: l,
      note: "Contains v=spf1 but does not start with it, so receivers ignore it.",
      tone: "bad",
    });
  }
  return rows;
}
