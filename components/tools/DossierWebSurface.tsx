import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { WebSurfaceSection } from "@/components/dossier/sections/WebSurfaceSection";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierWebSurface({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="web-surface-inspector" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="web-surface"
              toolSlug="web-surface-inspector"
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
