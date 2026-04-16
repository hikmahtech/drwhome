import { findPost, posts } from "@/content/posts";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const font = loadMonoFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
        ~/blog/{post.slug}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 56, color: OG_COLORS.fg, lineHeight: 1.2 }}>
          {post.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: OG_COLORS.muted,
            marginTop: 24,
            maxWidth: 1000,
          }}
        >
          {post.description}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
        {post.date} · drwho.me
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
