import { CheckSection } from "@/components/dossier/CheckSection";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";

export async function DmarcSection({ domain }: { domain: string }) {
  const r = await dmarcCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="dmarc" toolSlug="dmarc-checker" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="dmarc" toolSlug="dmarc-checker" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="dmarc" toolSlug="dmarc-checker" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="dmarc"
      toolSlug="dmarc-checker"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <p className="break-all">{r.data.record}</p>
      <dl className="mt-2 space-y-1 text-muted">
        {Object.entries(r.data.tags).map(([k, vv]) => (
          <div key={k}>
            <dt className="inline">{k}=</dt>
            <dd className="inline break-all">{vv}</dd>
          </div>
        ))}
      </dl>
    </CheckSection>
  );
}
