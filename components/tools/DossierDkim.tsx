import { DkimSection } from "@/components/dossier/sections/DkimSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierDkim({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dkim-lookup" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="dkim"
              toolSlug="dkim-lookup"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <DkimSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
