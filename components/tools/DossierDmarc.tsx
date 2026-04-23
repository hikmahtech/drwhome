import { DmarcSection } from "@/components/dossier/sections/DmarcSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierDmarc({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dmarc-checker" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="dmarc"
              toolSlug="dmarc-checker"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <DmarcSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
