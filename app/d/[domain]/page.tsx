import { CorsSection } from "@/components/dossier/sections/CorsSection";
import { DkimSection } from "@/components/dossier/sections/DkimSection";
import { DmarcSection } from "@/components/dossier/sections/DmarcSection";
import { DnsSection } from "@/components/dossier/sections/DnsSection";
import { DnsSectionSkeleton } from "@/components/dossier/sections/DnsSectionSkeleton";
import { HeadersSection } from "@/components/dossier/sections/HeadersSection";
import { MxSection } from "@/components/dossier/sections/MxSection";
import { RedirectsSection } from "@/components/dossier/sections/RedirectsSection";
import { SectionSkeleton } from "@/components/dossier/sections/SectionSkeleton";
import { SpfSection } from "@/components/dossier/sections/SpfSection";
import { TlsSection } from "@/components/dossier/sections/TlsSection";
import { WebSurfaceSection } from "@/components/dossier/sections/WebSurfaceSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { revalidateAllTagsAction } from "@/lib/dossier/cache-actions";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) return { title: "not found" };
  return pageMetadata({
    title: `dossier — ${v.domain}`,
    description: `dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, and web surface for ${v.domain}.`,
    path: `/d/${v.domain}`,
    type: "tool",
  });
}

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();

  const d = v.domain;

  const sp = await searchParams;
  if (sp.refresh === "1") {
    // Fire-and-forget: start the revalidation but don't await it to avoid blocking the render
    revalidateAllTagsAction(d).catch(console.error);
  }

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <p className="text-sm text-muted">
        an at-a-glance snapshot. each section streams in independently.
      </p>

      <Suspense fallback={<DnsSectionSkeleton domain={d} />}>
        <DnsSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton title="mx" toolSlug="dossier-mx" domain={d} message="resolving mx…" />
        }
      >
        <MxSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton title="spf" toolSlug="dossier-spf" domain={d} message="resolving spf…" />
        }
      >
        <SpfSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="dmarc"
            toolSlug="dossier-dmarc"
            domain={d}
            message="resolving dmarc…"
          />
        }
      >
        <DmarcSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="dkim"
            toolSlug="dossier-dkim"
            domain={d}
            message="probing dkim selectors…"
          />
        }
      >
        <DkimSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="tls"
            toolSlug="dossier-tls"
            domain={d}
            message="fetching tls cert…"
          />
        }
      >
        <TlsSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="redirects"
            toolSlug="dossier-redirects"
            domain={d}
            message="tracing redirects…"
          />
        }
      >
        <RedirectsSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="headers"
            toolSlug="dossier-headers"
            domain={d}
            message="fetching headers…"
          />
        }
      >
        <HeadersSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="cors"
            toolSlug="dossier-cors"
            domain={d}
            message="sending preflight…"
          />
        }
      >
        <CorsSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="web-surface"
            toolSlug="dossier-web-surface"
            domain={d}
            message="inspecting web surface…"
          />
        }
      >
        <WebSurfaceSection domain={d} />
      </Suspense>
    </article>
  );
}
