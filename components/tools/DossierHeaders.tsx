import { HeadersSection } from "@/components/dossier/sections/HeadersSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierHeaders({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-headers" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="headers"
              toolSlug="dossier-headers"
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
