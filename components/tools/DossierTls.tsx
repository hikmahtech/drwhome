import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { TlsSection } from "@/components/dossier/sections/TlsSection";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierTls({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="tls-certificate-checker" initial={domain ?? ""} />
      {domain && (
        <Suspense
          fallback={
            <SectionSkeleton
              title="tls"
              toolSlug="tls-certificate-checker"
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
