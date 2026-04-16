import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export type WhoamiResponse = {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
};

export async function GET() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || null;

  const payload: WhoamiResponse = {
    ip,
    country: h.get("x-vercel-ip-country"),
    city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city") ?? "") : null,
    region: h.get("x-vercel-ip-country-region"),
    latitude: h.get("x-vercel-ip-latitude"),
    longitude: h.get("x-vercel-ip-longitude"),
    timezone: h.get("x-vercel-ip-timezone"),
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
