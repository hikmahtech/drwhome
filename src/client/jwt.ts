import { decodeJwt } from "../lib/jwt";
import type { Report, Row } from "../reports/report";
import { defineLive } from "./_live";

function claimDate(value: unknown): string | null {
  if (typeof value !== "number") return null;
  return new Date(value * 1000).toISOString();
}

const CLAIMS = [
  ["iat", "Issued at"],
  ["nbf", "Not before"],
  ["exp", "Expires"],
] as const;

defineLive((f) => {
  const input = String(f.get("input") ?? "").trim();
  if (!input) return null;

  const r = decodeJwt(input);
  if (!r.ok) return { error: r.error };

  const payload = (r.payload && typeof r.payload === "object" ? r.payload : {}) as Record<
    string,
    unknown
  >;
  const rows: Row[] = [
    { label: "Header", value: JSON.stringify(r.header, null, 2) },
    { label: "Payload", value: JSON.stringify(r.payload, null, 2) },
  ];

  const now = Date.now() / 1000;
  let expired = false;
  for (const [claim, label] of CLAIMS) {
    const raw = payload[claim];
    const date = claimDate(raw);
    if (!date) continue;
    if (claim === "exp") expired = typeof raw === "number" && raw < now;
    rows.push({
      label,
      value: date,
      note: claim === "exp" && expired ? "This token is expired." : undefined,
      tone: claim === "exp" && expired ? "bad" : undefined,
    });
  }

  rows.push({
    label: "Signature",
    value: r.signature || "(empty)",
    note: "Not verified. This page has no key to check it with, and the token never leaves the page.",
  });

  const report: Report = {
    verdict: expired ? "Decoded — the token is expired" : "Decoded",
    tone: expired ? "warn" : "good",
    rows,
  };
  return { report };
});
