import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { SpfSection } from "@/components/dossier/sections/SpfSection";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierSpf({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-spf" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="spf"
              toolSlug="dossier-spf"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <SpfSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
