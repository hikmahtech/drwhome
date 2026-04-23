import { CheckSection } from "@/components/dossier/CheckSection";
import { SECURITY_HEADERS, headersCheck } from "@/lib/dossier/checks/headers";

export async function HeadersSection({ domain }: { domain: string }) {
  const r = await headersCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection
        title="headers"
        toolSlug="security-headers-checker"
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
        title="headers"
        toolSlug="security-headers-checker"
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
        title="headers"
        toolSlug="security-headers-checker"
        domain={domain}
        status="not_applicable"
      >
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  const { finalUrl, headers } = r.data;
  const securityKeys = SECURITY_HEADERS as readonly string[];
  const otherEntries = Object.entries(headers)
    .filter(([k]) => !securityKeys.includes(k))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <CheckSection
      title="headers"
      toolSlug="security-headers-checker"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <p>
        <span className="text-muted">final url: </span>
        <span className="break-all">{finalUrl}</span>
      </p>
      <div>
        <p className="text-muted">security headers</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {SECURITY_HEADERS.map((name) => (
            <div key={name} className="contents">
              <dt className="text-muted">{name}</dt>
              <dd className="break-all">
                {headers[name] ?? <span className="text-muted">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {otherEntries.length > 0 && (
        <div>
          <p className="text-muted">other headers</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {otherEntries.map(([name, value]) => (
              <div key={name} className="contents">
                <dt className="text-muted">{name}</dt>
                <dd className="break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </CheckSection>
  );
}
