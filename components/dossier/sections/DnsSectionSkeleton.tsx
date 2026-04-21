import { CheckSection } from "@/components/dossier/CheckSection";

export function DnsSectionSkeleton({ domain }: { domain: string }) {
  return (
    <CheckSection title="dns" toolSlug="dossier-dns" domain={domain} status="not_applicable">
      <p className="text-muted">resolving…</p>
    </CheckSection>
  );
}
