import { type OgBadgeState, summarizeForOg } from "@/lib/dossier/og-summary";
import { dossierChecks } from "@/lib/dossier/registry";
import type { CheckResult } from "@/lib/dossier/types";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

const PER_CHECK_TIMEOUT_MS = 1500;

async function timed(p: Promise<CheckResult<unknown>>): Promise<CheckResult<unknown> | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PER_CHECK_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

function badgeColor(state: OgBadgeState): string {
  if (state === "pass") return OG_COLORS.accent;
  if (state === "fail") return "#ef4444";
  return OG_COLORS.muted;
}

export default async function OG({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: raw } = await params;
  const v = validateDomain(decodeURIComponent(raw));
  if (!v.ok) notFound();
  const domain = v.domain;
  const font = loadMonoFont();

  const results = await Promise.all(dossierChecks.map((c) => timed(c.run(domain))));
  const summary = summarizeForOg(results);

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
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>~/d/{domain}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 72, color: OG_COLORS.fg, lineHeight: 1.1 }}>
          {domain}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 40,
          }}
        >
          {dossierChecks.map((c, i) => {
            const b = summary.badges[i];
            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid ${OG_COLORS.border}`,
                  padding: "8px 14px",
                  fontSize: 22,
                  color: OG_COLORS.fg,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: badgeColor(b.state),
                    display: "flex",
                  }}
                />
                {c.title}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
        {summary.passed}/{summary.total} checks passed · drwho.me
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
