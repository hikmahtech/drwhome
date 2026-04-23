import { HeadersSection } from "@/components/dossier/sections/HeadersSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierHeaders({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="security-headers-checker" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="headers"
              toolSlug="security-headers-checker"
              domain={domain}
              message="fetching…"
            />
          }
        >
          <HeadersSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
