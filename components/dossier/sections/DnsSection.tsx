import { CheckSection } from "@/components/dossier/CheckSection";
import { DNS_DOSSIER_TYPES, dnsCheck } from "@/lib/dossier/checks/dns";

export async function DnsSection({ domain }: { domain: string }) {
  const r = await dnsCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="dns" toolSlug="dns-records-lookup" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="dns" toolSlug="dns-records-lookup" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection
        title="dns"
        toolSlug="dns-records-lookup"
        domain={domain}
        status="not_applicable"
      >
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="dns"
      toolSlug="dns-records-lookup"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <dl className="space-y-2">
        {DNS_DOSSIER_TYPES.map((t) => {
          const rows = r.data.records[t];
          return (
            <div key={t}>
              <dt className="text-muted">{t}</dt>
              <dd>
                {rows.length === 0 ? (
                  <span className="text-muted">—</span>
                ) : (
                  <ul className="list-none p-0">
                    {rows.map((a) => (
                      <li key={`${t}-${a.data}`} className="break-all">
                        <span className="text-muted">ttl={a.TTL} </span>
                        {a.data}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </CheckSection>
  );
}
