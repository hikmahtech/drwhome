import { CheckSection } from "@/components/dossier/CheckSection";
import { corsCheck } from "@/lib/dossier/checks/cors";

export async function CorsSection({ domain }: { domain: string }) {
  const r = await corsCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection title="cors" toolSlug="cors-checker" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="cors" toolSlug="cors-checker" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="cors" toolSlug="cors-checker" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  const d = r.data;
  const rows: [string, string | undefined][] = [
    ["access-control-allow-origin", d.allowOrigin],
    ["access-control-allow-methods", d.allowMethods],
    ["access-control-allow-headers", d.allowHeaders],
    ["access-control-allow-credentials", d.allowCredentials],
    ["access-control-max-age", d.maxAge],
    ["access-control-expose-headers", d.exposeHeaders],
  ];

  return (
    <CheckSection
      title="cors"
      toolSlug="cors-checker"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted">origin</dt>
        <dd className="break-all">{d.origin}</dd>
        <dt className="text-muted">method</dt>
        <dd>{d.method}</dd>
        <dt className="text-muted">preflight status</dt>
        <dd>{d.preflightStatus}</dd>
      </dl>
      <div>
        <p className="text-muted">access-control-* headers</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted">{name}</dt>
              <dd className="break-all">{value ?? <span className="text-muted">—</span>}</dd>
            </div>
          ))}
        </dl>
      </div>
      {!d.anyAcHeader && (
        <p className="text-muted">
          no access-control-* headers returned — site does not advertise CORS to this origin
        </p>
      )}
    </CheckSection>
  );
}
