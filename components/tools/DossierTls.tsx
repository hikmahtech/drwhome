import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { TlsSection } from "@/components/dossier/sections/TlsSection";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierTls({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-tls" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="tls"
              toolSlug="dossier-tls"
              domain={domain}
              message="resolving…"
            />
          }
        >
          <TlsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
