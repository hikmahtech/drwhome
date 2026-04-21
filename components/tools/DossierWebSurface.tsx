import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { WebSurfaceSection } from "@/components/dossier/sections/WebSurfaceSection";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierWebSurface({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-web-surface" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="web-surface"
              toolSlug="dossier-web-surface"
              domain={domain}
              message="fetching…"
            />
          }
        >
          <WebSurfaceSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
