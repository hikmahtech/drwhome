import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { DossierForm } from "@/components/tools/DossierForm";
import { Suspense } from "react";

export function DossierDns({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierForm slug="dossier-dns" initial={domain ?? ""} />
      {domain && (
        <Suspense fallback={<DnsSectionSkeleton domain={domain} />}>
          <DnsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
