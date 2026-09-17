import type { Report } from "../reports/report";

/** Server-side twin of src/client/_render.ts. Keep the two in step: same tags, same classes. */
export function ReportView({ report }: { report: Report }) {
  return (
    <>
      <p class="verdict" data-tone={report.tone}>
        {report.verdict}
      </p>
      {report.rows.length > 0 ? (
        <dl class="rows">
          {report.rows.map((r) => (
            <div class="row" data-tone={r.tone}>
              <dt>{r.label}</dt>
              <dd>
                <div class="v">{r.value}</div>
                {r.note ? <div class="note">{r.note}</div> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

export function MoreBand({ domain, from }: { domain: string; from: string }) {
  const href = `/domain-report?domain=${encodeURIComponent(domain)}&from=${encodeURIComponent(from)}`;
  return (
    <aside class="more">
      <div>
        <h2>This is one check of 18 for {domain}.</h2>
        <p>
          Domain Posture, our sister site, runs all 18, grades each one and tells you what to fix
          first.
        </p>
      </div>
      <a href={href}>What the full report covers</a>
    </aside>
  );
}
