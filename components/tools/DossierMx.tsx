import { MxSection } from "@/components/dossier/sections/MxSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierMx({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="mx-lookup" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton title="mx" toolSlug="mx-lookup" domain={domain} message="resolving…" />
          }
        >
          <MxSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
