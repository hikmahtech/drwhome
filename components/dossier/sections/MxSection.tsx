import { CheckSection } from "@/components/dossier/CheckSection";
import { mxCheck } from "@/lib/dossier/checks/mx";

export async function MxSection({ domain }: { domain: string }) {
  const r = await mxCheck(domain);

  if (r.status === "error") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection title="mx" toolSlug="dossier-mx" domain={domain} status="not_applicable">
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }

  return (
    <CheckSection
      title="mx"
      toolSlug="dossier-mx"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <ul className="list-none p-0 space-y-1">
        {r.data.records.map((m) => (
          <li key={`${m.priority}-${m.exchange}`} className="break-all">
            <span className="text-muted">pri={m.priority} </span>
            {m.exchange}
          </li>
        ))}
      </ul>
    </CheckSection>
  );
}
