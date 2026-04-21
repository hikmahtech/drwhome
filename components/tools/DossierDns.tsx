import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { DossierDnsForm } from "@/components/tools/DossierDnsForm";
import { Suspense } from "react";

export function DossierDns({ domain }: { domain?: string }) {
  return (
    <div className="space-y-4">
      <DossierDnsForm initial={domain ?? ""} />
      {domain && (
        <Suspense fallback={<DnsSectionSkeleton domain={domain} />}>
          <DnsSection domain={domain} />
        </Suspense>
      )}
    </div>
  );
}
