import type { Report } from "../reports/report";

/** Builds a report with DOM calls only, never innerHTML: a hostile DNS record cannot inject markup. */
export function el(tag: string, cls: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderReport(report: Report): HTMLElement[] {
  const verdict = el("p", "verdict", report.verdict);
  verdict.dataset.tone = report.tone;

  const rows = el("dl", "rows");
  for (const r of report.rows) {
    const row = el("div", "row");
    if (r.tone) row.dataset.tone = r.tone;
    const dd = el("dd", "");
    dd.append(el("div", "v", r.value));
    if (r.note) dd.append(el("div", "note", r.note));
    row.append(el("dt", "", r.label), dd);
    rows.append(row);
  }
  return report.rows.length > 0 ? [verdict, rows] : [verdict];
}
