import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { DossierViewTracker } from "@/components/dossier/DossierViewTracker";
import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { ShareButton } from "@/components/dossier/ShareButton";
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
import { isDenied } from "@/lib/dossier/denylist";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { extractClientIp } from "@/lib/rate-limit/client-ip";
import { consumeDossier } from "@/lib/rate-limit/ratelimit";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

  const denied = isDenied(d);
  if (denied.denied) {
    return (
      <article className="space-y-4">
        <Breadcrumb path={`~/d/${d}`} />
        <TerminalPrompt>dossier for {d}</TerminalPrompt>
        <DenylistBanner domain={d} reason={denied.reason} />
      </article>
    );
  }
  const ip = extractClientIp(await headers());
  const rl = await consumeDossier(ip);
  if (!rl.allowed) {
    return (
      <article className="space-y-4">
        <Breadcrumb path={`~/d/${d}`} />
        <TerminalPrompt>dossier for {d}</TerminalPrompt>
        <RateLimitBanner domain={d} resetAt={rl.resetAt} />
      </article>
    );
  }

  const sp = await searchParams;
  if (sp.refresh === "1") {
    // revalidateTag cannot be called during render; delegate to the Route Handler
    // which runs outside the render pipeline, then redirects back to the clean URL.
    redirect(`/api/dossier/revalidate?domain=${d}`);
  }

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/d/${d}`} />
      <TerminalPrompt>dossier for {d}</TerminalPrompt>
      <DossierViewTracker domain={d} />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          an at-a-glance snapshot. each section streams in independently.
        </p>
        <ShareButton domain={d} href={`${siteUrl()}/d/${d}`} />
      </div>

      <Suspense fallback={<DnsSectionSkeleton domain={d} />}>
        <DnsSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton title="mx" toolSlug="mx-lookup" domain={d} message="resolving mx…" />
        }
      >
        <MxSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton title="spf" toolSlug="spf-checker" domain={d} message="resolving spf…" />
        }
      >
        <SpfSection domain={d} />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            title="dmarc"
            toolSlug="dmarc-checker"
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
            toolSlug="dkim-lookup"
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
            toolSlug="tls-certificate-checker"
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
            toolSlug="redirect-checker"
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
            toolSlug="security-headers-checker"
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
            toolSlug="cors-checker"
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
            toolSlug="web-surface-inspector"
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
