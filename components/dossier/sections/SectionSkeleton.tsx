import { CheckSection } from "@/components/dossier/CheckSection";

export function SectionSkeleton({
  title,
  toolSlug,
  domain,
  message = "loading…",
}: {
  title: string;
  toolSlug: string;
  domain: string;
  message?: string;
}) {
  return (
    <CheckSection title={title} toolSlug={toolSlug} domain={domain} status="not_applicable">
      <p className="text-muted">{message}</p>
    </CheckSection>
  );
}
