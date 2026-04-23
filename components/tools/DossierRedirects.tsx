import { RedirectsSection } from "@/components/dossier/sections/RedirectsSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierRedirects({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="redirect-checker" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="redirects"
              toolSlug="redirect-checker"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <RedirectsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
