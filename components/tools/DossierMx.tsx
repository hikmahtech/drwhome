import { MxSection } from "@/components/dossier/sections/MxSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierMx({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-mx" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="mx"
              toolSlug="dossier-mx"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <MxSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
