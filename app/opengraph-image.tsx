import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;
export const alt = "drwho.me — network + dev tools";

export default async function OG() {
  const font = loadMonoFont();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
        fontSize: 64,
      }}
    >
      <div style={{ display: "flex", color: OG_COLORS.accent }}>&gt; drwho.me</div>
      <div style={{ display: "flex", color: OG_COLORS.muted, fontSize: 32, marginTop: 24 }}>
        network + dev tools.
      </div>
      <div style={{ display: "flex", color: OG_COLORS.muted, fontSize: 28, marginTop: 8 }}>
        minimal and fast.
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
