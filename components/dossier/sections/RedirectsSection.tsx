import { CheckSection } from "@/components/dossier/CheckSection";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";

export async function RedirectsSection({ domain }: { domain: string }) {
  const r = await redirectsCheck(domain);
  if (r.status === "error") {
    return (
      <CheckSection title="redirects" toolSlug="redirect-checker" domain={domain} status="error">
        <p className="text-danger">{r.message}</p>
      </CheckSection>
    );
  }
  if (r.status === "timeout") {
    return (
      <CheckSection title="redirects" toolSlug="redirect-checker" domain={domain} status="timeout">
        <p className="text-muted">timed out after {r.ms}ms</p>
      </CheckSection>
    );
  }
  if (r.status === "not_applicable") {
    return (
      <CheckSection
        title="redirects"
        toolSlug="redirect-checker"
        domain={domain}
        status="not_applicable"
      >
        <p className="text-muted">{r.reason}</p>
      </CheckSection>
    );
  }
  const { hops, finalStatus } = r.data;
  return (
    <CheckSection
      title="redirects"
      toolSlug="redirect-checker"
      domain={domain}
      status="ok"
      fetchedAt={r.fetchedAt}
    >
      <p>
        <span className="text-muted">final status: </span>
        <span>{finalStatus}</span>
        <span className="text-muted">
          {" "}
          · {hops.length} hop{hops.length === 1 ? "" : "s"}
        </span>
      </p>
      <ol className="list-decimal pl-6 space-y-1">
        {hops.map((h, i) => (
          <li key={`${i}-${h.url}`} className="break-all">
            <span className="text-muted">[{h.status}]</span> {h.url}
          </li>
        ))}
      </ol>
    </CheckSection>
  );
}
