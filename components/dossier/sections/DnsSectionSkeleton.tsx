import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";

export function DnsSectionSkeleton({ domain }: { domain: string }) {
  return (
    <SectionSkeleton title="dns" toolSlug="dossier-dns" domain={domain} message="resolving…" />
  );
}
