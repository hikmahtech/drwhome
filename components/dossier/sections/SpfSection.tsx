import { CheckSection } from "@/components/dossier/CheckSection";
import { spfCheck } from "@/lib/dossier/checks/spf";

export async function SpfSection({ domain }: { domain: string }) {
  const r = await spfCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="spf" toolSlug="dossier-spf" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="spf"
      toolSlug="dossier-spf"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <p className="break-all">{r.data.record}</p>
      <ul className="list-none p-0 mt-2 space-y-1 text-muted">
        {r.data.mechanisms.map((m) => (
          <li key={m} className="break-all">
            {m}
          </li>
        ))}
      </ul>
    </CheckSection>
  );
}
