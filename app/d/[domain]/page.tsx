import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) return { title: "not found" };
  return pageMetadata({
    title: `dossier — ${v.domain}`,
    description: `dns, tls, email auth, headers, and more for ${v.domain}.`,
    path: `/d/${v.domain}`,
    type: "tool",
  });
}

export default async function DossierPage({
  params,
}: { params: Promise<{ domain: string }> }) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${v.domain}`} />
      <TerminalPrompt>dossier for {v.domain}</TerminalPrompt>
      <p className="text-sm text-muted">
        an at-a-glance snapshot. each section streams in independently.
      </p>

      <Suspense fallback={<DnsSectionSkeleton domain={v.domain} />}>
        <DnsSection domain={v.domain} />
      </Suspense>

      {/* Plan 2 will land 9 more <Suspense> sections here */}
    </article>
  );
}
