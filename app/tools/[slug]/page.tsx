import { AdSlot } from "@/components/AdSlot";
import { DenylistBanner } from "@/components/dossier/DenylistBanner";
import { RateLimitBanner } from "@/components/dossier/RateLimitBanner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findToolContent } from "@/content/tool-seo";
import { findTool, tools } from "@/content/tools";
import { isDenied } from "@/lib/dossier/denylist";
import type { DossierCheckId } from "@/lib/dossier/registry";
import { extractClientIp } from "@/lib/rate-limit/client-ip";
import { consumeStandaloneDossier } from "@/lib/rate-limit/ratelimit";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildHowToJsonLd,
  buildSoftwareApplicationJsonLd,
  pageMetadata,
  siteUrl,
} from "@/lib/seo";
import type { Metadata, Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return { title: "not found" };
  const content = findToolContent(slug);
  return {
    ...pageMetadata({
      title: tool.name,
      description: content?.lead ?? tool.description,
      path: `/tools/${tool.slug}`,
      type: "tool",
    }),
    keywords: tool.keywords,
  };
}

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const domainRaw = sp.domain;
  const domain = typeof domainRaw === "string" ? domainRaw : undefined;
  const tool = findTool(slug);
  if (!tool) notFound();

  const isDossierSlug = slug.startsWith("dossier-");
  if (isDossierSlug && typeof domain === "string" && domain.length > 0) {
    const denied = isDenied(domain);
    if (denied.denied) {
      return (
        <article className="space-y-4">
          <Breadcrumb path={`~/tools/${slug}`} />
          <TerminalPrompt>{tool.name}</TerminalPrompt>
          <DenylistBanner domain={domain} reason={denied.reason} />
        </article>
      );
    }
    const ip = extractClientIp(await headers());
    const rl = await consumeStandaloneDossier(ip);
    if (!rl.allowed) {
      return (
        <article className="space-y-4">
          <Breadcrumb path={`~/tools/${slug}`} />
          <TerminalPrompt>{tool.name}</TerminalPrompt>
          <RateLimitBanner domain={domain} resetAt={rl.resetAt} />
        </article>
      );
    }
    if (sp.refresh === "1") {
      // Cannot call revalidateTag during render (Next.js 15 constraint).
      // Delegate to Route Handler which runs outside the render pipeline.
      const id = slug.slice("dossier-".length) as DossierCheckId;
      const returnTo = encodeURIComponent(`/tools/${slug}?domain=${domain}`);
      redirect(`/api/dossier/revalidate?domain=${domain}&check=${id}&return_to=${returnTo}`);
    }
  }

  const Component = tool.component;
  const content = findToolContent(slug);
  const url = siteUrl();

  const softwareJsonLd = buildSoftwareApplicationJsonLd({
    name: tool.name,
    description: content?.lead ?? tool.description,
    path: `/tools/${tool.slug}`,
    siteUrl: url,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    crumbs: [
      { name: "home", path: "/" },
      { name: "tools", path: "/tools" },
      { name: tool.name, path: `/tools/${tool.slug}` },
    ],
    siteUrl: url,
  });

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/tools/${slug}`} />
      <TerminalPrompt>{tool.name}</TerminalPrompt>
      <p className="text-sm">
        {content?.lead ?? <span className="text-muted">{tool.description}</span>}
      </p>
      <Component domain={domain} />

      {content && (
        <div className="space-y-8 mt-8">
          <section className="space-y-2">
            <h2 className="text-sm text-muted">## overview</h2>
            <p className="text-sm whitespace-pre-line">{content.overview}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-muted">## how to use</h2>
            <ol className="text-sm space-y-2 list-decimal pl-5">
              {content.howTo.map((s) => (
                <li key={s.step}>
                  <strong>{s.step}</strong> — {s.detail}
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-muted">## examples</h2>
            <div className="space-y-3">
              {content.examples.map((e, i) => (
                <TerminalCard
                  key={`${tool.slug}-ex-${i}`}
                  label={e.note ? `example ${i + 1} — ${e.note}` : `example ${i + 1}`}
                >
                  <div className="space-y-2">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      <span className="text-muted">$ in</span>
                      {"\n"}
                      {e.input}
                    </pre>
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      <span className="text-muted"># out</span>
                      {"\n"}
                      {e.output}
                    </pre>
                  </div>
                </TerminalCard>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-muted">## common mistakes</h2>
            <ul className="text-sm space-y-2 list-none p-0">
              {content.gotchas.map((g) => (
                <li key={g.title}>
                  <code className="text-accent">{g.title}</code> — {g.body}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-muted">## faq</h2>
            <div>
              {content.faq.map((f) => (
                <details key={f.q} className="border-b py-2">
                  <summary className="cursor-pointer text-sm">{f.q}</summary>
                  <p className="text-sm mt-2 text-muted whitespace-pre-line">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {content.related.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm text-muted">## related tools</h2>
              <ul className="text-sm space-y-1 list-none p-0">
                {content.related
                  .map((relSlug) => findTool(relSlug))
                  .filter((t): t is NonNullable<typeof t> => t !== undefined)
                  .map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tools/${t.slug}` as Route} className="text-accent">
                        <code>{t.name}</code>
                      </Link>{" "}
                      — {t.description}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {content.references.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm text-muted">## references</h2>
              <ol className="text-sm space-y-1 list-decimal pl-5">
                {content.references.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      className="text-accent"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {r.title}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}

      <AdSlot slot={`tool-${slug}`} />
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {content && (
        <>
          <JsonLd data={buildFaqJsonLd(content.faq)} />
          <JsonLd
            data={buildHowToJsonLd({
              name: `how to use ${tool.name}`,
              description: content.lead,
              steps: content.howTo,
            })}
          />
        </>
      )}
    </article>
  );
}
