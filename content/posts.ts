import Example, { frontmatter as exampleFm } from "@/content/posts/_example.mdx";
import type { Post } from "@/lib/blog";
import { parseFrontmatter } from "@/lib/blog";
import type { ComponentType } from "react";

export type PostRecord = Post & { component: ComponentType };

function record(slug: string, fm: unknown, component: ComponentType): PostRecord {
  const r = parseFrontmatter(slug, fm);
  if (!r.ok) throw new Error(`invalid frontmatter for ${slug}: ${r.error}`);
  return { ...r.post, component };
}

export const posts: PostRecord[] = [record("_example", exampleFm, Example)]
  .filter((p) => !p.slug.startsWith("_"))
  .sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostRecord | undefined {
  return posts.find((p) => p.slug === slug);
}
