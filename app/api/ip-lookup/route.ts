import { lookupIp } from "@/lib/tools/ipLookup";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const ip = new URL(req.url).searchParams.get("ip") ?? "";
  const token = process.env.IPINFO_TOKEN ?? "";
  const r = await lookupIp(ip, token);
  const status = r.ok ? 200 : 400;
  return NextResponse.json(r, {
    status,
    headers: r.ok
      ? { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
      : { "Cache-Control": "no-store" },
  });
}
