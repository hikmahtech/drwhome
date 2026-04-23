import { CheckSection } from "@/components/dossier/CheckSection";
import { tlsCheck } from "@/lib/dossier/checks/tls";

export async function TlsSection({ domain }: { domain: string }) {
  const r = await tlsCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection title="tls" toolSlug="tls-certificate-checker" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="tls" toolSlug="tls-certificate-checker" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection
        title="tls"
        toolSlug="tls-certificate-checker"
        domain={domain}
        status="not_applicable"
      >
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  const {
    subject,
    issuer,
    validFrom,
    validTo,
    sans,
    fingerprint256,
    authorized,
    authorizationError,
  } = r.data;
  return (
    <CheckSection
      title="tls"
      toolSlug="tls-certificate-checker"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <dl className="space-y-1">
        <div>
          <dt className="text-muted inline">subject cn: </dt>
          <dd className="inline">{subject.CN ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted inline">issuer: </dt>
          <dd className="inline">
            {issuer.CN ?? "—"} / {issuer.O ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted inline">valid: </dt>
          <dd className="inline">
            {validFrom} → {validTo}
          </dd>
        </div>
        <div>
          <dt className="text-muted inline">authorized: </dt>
          <dd className="inline">{authorized ? "yes" : "no"}</dd>
        </div>
        {!authorized && authorizationError && (
          <div>
            <dt className="text-muted inline">auth error: </dt>
            <dd className="inline text-danger">{authorizationError}</dd>
          </div>
        )}
        {fingerprint256 && (
          <div>
            <dt className="text-muted inline">sha256: </dt>
            <dd className="inline break-all">{fingerprint256}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted">sans</dt>
          <dd>
            <ul className="list-none p-0">
              {sans.length === 0 ? (
                <li className="text-muted">—</li>
              ) : (
                sans.map((s) => (
                  <li key={s} className="break-all">
                    {s}
                  </li>
                ))
              )}
            </ul>
          </dd>
        </div>
      </dl>
    </CheckSection>
  );
}
