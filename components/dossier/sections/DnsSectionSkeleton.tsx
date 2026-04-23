import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";

export function DnsSectionSkeleton({ domain }: { domain: string }) {
  return (
    <SectionSkeleton
      title="dns"
      toolSlug="dns-records-lookup"
      domain={domain}
      message="resolving…"
    />
  );
}
