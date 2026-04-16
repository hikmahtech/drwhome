import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findTool, tools } from "@/content/tools";
import { buildSoftwareApplicationJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return { title: "not found" };
  return {
    ...pageMetadata({
      title: tool.name,
      description: tool.description,
      path: `/tools/${tool.slug}`,
      type: "tool",
    }),
    keywords: tool.keywords,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
  const Component = tool.component;
  const jsonLd = buildSoftwareApplicationJsonLd({
    name: tool.name,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    siteUrl: siteUrl(),
  });

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/tools/${slug}`} />
      <TerminalPrompt>{tool.name}</TerminalPrompt>
      <p className="text-sm text-muted">{tool.description}</p>
      <Component />
      <AdSlot slot={`tool-${slug}`} />
      <JsonLd data={jsonLd} />
    </article>
  );
}
