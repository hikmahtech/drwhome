import type { Post } from "@/lib/blog";

export const posts: Post[] = [];

export function findPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
