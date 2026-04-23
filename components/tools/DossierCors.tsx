import { CorsSection } from "@/components/dossier/sections/CorsSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierCors({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="cors-checker" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="cors"
              toolSlug="cors-checker"
              domain={domain}
              message="fetching…"
            />
          }
        >
          <CorsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
