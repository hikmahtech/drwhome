import Example, { frontmatter as exampleFm } from "@/content/posts/_example.mdx";
import Base64Article, { frontmatter as base64Fm } from "@/content/posts/base64-isnt-encryption.mdx";
import Jwt, { frontmatter as jwtFm } from "@/content/posts/decode-jwt-without-verifying.mdx";
import Dns, { frontmatter as dnsFm } from "@/content/posts/dns-over-https-cloudflare-primer.mdx";
import Ip, { frontmatter as ipFm } from "@/content/posts/reading-ip-from-vercel-edge-headers.mdx";
import Uuid, { frontmatter as uuidFm } from "@/content/posts/uuidv4-vs-uuidv7.mdx";
import type { Post } from "@/lib/blog";
import { parseFrontmatter } from "@/lib/blog";
import type { ComponentType } from "react";

export type PostRecord = Post & { component: ComponentType };

function record(slug: string, fm: unknown, component: ComponentType): PostRecord {
  const r = parseFrontmatter(slug, fm);
  if (!r.ok) throw new Error(`invalid frontmatter for ${slug}: ${r.error}`);
  return { ...r.post, component };
}

export const posts: PostRecord[] = [
  record("base64-isnt-encryption", base64Fm, Base64Article),
  record("decode-jwt-without-verifying", jwtFm, Jwt),
  record("dns-over-https-cloudflare-primer", dnsFm, Dns),
  record("reading-ip-from-vercel-edge-headers", ipFm, Ip),
  record("uuidv4-vs-uuidv7", uuidFm, Uuid),
  record("_example", exampleFm, Example),
]
  .filter((p) => !p.slug.startsWith("_"))
  .sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostRecord | undefined {
  return posts.find((p) => p.slug === slug);
}
