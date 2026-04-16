import { PostMeta } from "@/components/blog/PostMeta";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findPost, posts } from "@/content/posts";
import { findTool } from "@/content/tools";
import { buildArticleJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "not found" };
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const MDX = post.component;
  const tool = post.relatedTool ? findTool(post.relatedTool) : undefined;
  const jsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    date: post.date,
    siteUrl: siteUrl(),
  });

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/blog/${post.slug}`} />
      <TerminalPrompt>{post.title}</TerminalPrompt>
      <PostMeta post={post} />
      <div>
        <MDX />
      </div>
      {tool && (
        <aside className="border-t pt-4 mt-8 text-sm">
          related tool: <Link href={`/tools/${tool.slug}` as Route}>/tools/{tool.slug}</Link>
        </aside>
      )}
      <JsonLd data={jsonLd} />
    </article>
  );
}
