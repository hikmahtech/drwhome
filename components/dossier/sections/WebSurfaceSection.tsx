import { CheckSection } from "@/components/dossier/CheckSection";
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";

export async function WebSurfaceSection({ domain }: { domain: string }) {
  const r = await webSurfaceCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection
        title="web-surface"
        toolSlug="dossier-web-surface"
        domain={domain}
        status="error"
      >
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection
        title="web-surface"
        toolSlug="dossier-web-surface"
        domain={domain}
        status="timeout"
      >
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection
        title="web-surface"
        toolSlug="dossier-web-surface"
        domain={domain}
        status="not_applicable"
      >
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  const d = r.data;
  const ogEntries = Object.entries(d.head.og);
  const twitterEntries = Object.entries(d.head.twitter);

  return (
    <CheckSection
      title="web-surface"
      toolSlug="dossier-web-surface"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <div>
        <p className="text-muted">robots.txt</p>
        {d.robots.present ? (
          <details>
            <summary>present</summary>
            <pre className="whitespace-pre-wrap break-all text-sm">{d.robots.body}</pre>
          </details>
        ) : (
          <p>absent</p>
        )}
      </div>

      <div>
        <p className="text-muted">sitemap.xml</p>
        {d.sitemap.present ? (
          <p>
            present — <span className="text-muted">{d.sitemap.urlCount ?? 0} url(s)</span>
          </p>
        ) : (
          <p>absent</p>
        )}
      </div>

      <div>
        <p className="text-muted">head</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">title</dt>
          <dd className="break-all">{d.head.title ?? <span className="text-muted">—</span>}</dd>
          <dt className="text-muted">description</dt>
          <dd className="break-all">
            {d.head.description ?? <span className="text-muted">—</span>}
          </dd>
        </dl>
      </div>

      <div>
        <p className="text-muted">social</p>
        {ogEntries.length === 0 && twitterEntries.length === 0 ? (
          <p className="text-muted">no OpenGraph or Twitter meta tags found</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ogEntries.map(([k, v]) => (
              <div key={`og-${k}`} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
            {twitterEntries.map(([k, v]) => (
              <div key={`tw-${k}`} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </CheckSection>
  );
}
