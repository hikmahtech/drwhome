import { findTool, tools } from "@/content/tools";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
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
        ~/tools/{tool.slug}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 80, color: OG_COLORS.accent }}>
          &gt; {tool.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: OG_COLORS.muted,
            marginTop: 24,
            maxWidth: 1000,
          }}
        >
          {tool.description}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>drwho.me</div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
