import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findTool, tools } from "@/content/tools";
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
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
  const Component = tool.component;

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/tools/${slug}`} />
      <TerminalPrompt>{tool.name}</TerminalPrompt>
      <p className="text-sm text-muted">{tool.description}</p>
      <Component />
      <AdSlot slot={`tool-${slug}`} />
    </article>
  );
}
