import type { Context } from "hono";
import type { Report, Row } from "../../reports/report";
import { ReportView } from "../ReportView";

/**
 * Prefixes for header families the hosting proxy adds (Cloudflare and the reverse proxy).
 * Showing them would leak infrastructure detail or just confuse a visitor who wants to see
 * what THEIR browser sent, not what got bolted on along the way.
 */
export const HIDDEN_HEADER_PREFIXES = ["cf-", "x-forwarded-"];
/** Exact header names the hosting proxy adds, not a whole family. */
export const HIDDEN_HEADER_NAMES = new Set(["x-real-ip", "cdn-loop", "traceparent"]);
/** The one cf-* header worth keeping: it is about the visitor, not the infrastructure. */
const KEEP_DESPITE_PREFIX = new Set(["cf-ipcountry"]);

export function isHiddenHeader(name: string): boolean {
  const n = name.toLowerCase();
  if (KEEP_DESPITE_PREFIX.has(n)) return false;
  if (HIDDEN_HEADER_NAMES.has(n)) return true;
  return HIDDEN_HEADER_PREFIXES.some((p) => n.startsWith(p));
}

export function headerRows(headers: Headers): Row[] {
  return [...headers.entries()]
    .filter(([name]) => !isHiddenHeader(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

export default function Headers({ c }: { c: Context }) {
  const rows = headerRows(c.req.raw.headers);
  const report: Report = {
    verdict: `${rows.length} header${rows.length === 1 ? "" : "s"} on this request`,
    tone: "plain",
    rows,
  };
  return (
    <div class="report first">
      <ReportView report={report} />
      <p class="hint">
        A few headers our hosting adds (Cloudflare and our reverse proxy) are left out so this shows
        what your browser sent, not our infrastructure.
      </p>
    </div>
  );
}
