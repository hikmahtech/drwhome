import { DNS_TYPES, type DnsType, resolveDns } from "@/lib/tools/dns";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = params.get("name") ?? "";
  const typeRaw = params.get("type") ?? "A";
  const type = (DNS_TYPES as readonly string[]).includes(typeRaw)
    ? (typeRaw as DnsType)
    : ("A" as DnsType);
  const r = await resolveDns(name, type);
  return NextResponse.json(r, {
    status: r.ok ? 200 : 400,
    headers: r.ok
      ? { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      : { "Cache-Control": "no-store" },
  });
}
