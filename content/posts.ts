import Base64Article, { frontmatter as base64Fm } from "@/content/posts/base64-isnt-encryption.mdx";
import Redir, { frontmatter as redirFm } from "@/content/posts/debug-redirect-chain.mdx";
import Jwt, { frontmatter as jwtFm } from "@/content/posts/decode-jwt-without-verifying.mdx";
import Dkim, { frontmatter as dkimFm } from "@/content/posts/dkim-selectors-explained.mdx";
import Dns, { frontmatter as dnsFm } from "@/content/posts/dns-over-https-cloudflare-primer.mdx";
import Deliv, { frontmatter as delivFm } from "@/content/posts/email-deliverability-checklist.mdx";
import Ip, { frontmatter as ipFm } from "@/content/posts/reading-ip-from-vercel-edge-headers.mdx";
import SecHdr, { frontmatter as secHdrFm } from "@/content/posts/security-headers-guide.mdx";
import Spf10, { frontmatter as spf10Fm } from "@/content/posts/spf-10-lookup-limit.mdx";
import Uuid, { frontmatter as uuidFm } from "@/content/posts/uuidv4-vs-uuidv7.mdx";
import Dmarc, { frontmatter as dmarcFm } from "@/content/posts/what-is-dmarc.mdx";
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
  record("what-is-dmarc", dmarcFm, Dmarc),
  record("spf-10-lookup-limit", spf10Fm, Spf10),
  record("dkim-selectors-explained", dkimFm, Dkim),
  record("email-deliverability-checklist", delivFm, Deliv),
  record("debug-redirect-chain", redirFm, Redir),
  record("security-headers-guide", secHdrFm, SecHdr),
]
  .filter((p) => !p.slug.startsWith("_"))
  .sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostRecord | undefined {
  return posts.find((p) => p.slug === slug);
}
