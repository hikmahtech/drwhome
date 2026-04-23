import { CheckSection } from "@/components/dossier/CheckSection";
import { dkimCheck } from "@/lib/dossier/checks/dkim";

export async function DkimSection({ domain }: { domain: string }) {
  const r = await dkimCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="dkim" toolSlug="dkim-lookup" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="dkim" toolSlug="dkim-lookup" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="dkim" toolSlug="dkim-lookup" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="dkim"
      toolSlug="dkim-lookup"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <dl className="space-y-1">
        {r.data.selectors.map((s) => (
          <div key={s.selector}>
            <dt className="text-muted inline">{s.selector}: </dt>
            {s.status === "found" ? (
              <dd className="inline break-all">{s.record}</dd>
            ) : (
              <dd className="inline text-muted">—</dd>
            )}
          </div>
        ))}
      </dl>
    </CheckSection>
  );
}
