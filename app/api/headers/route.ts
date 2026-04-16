import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const h = await headers();
  const entries: [string, string][] = [];
  h.forEach((v, k) => entries.push([k, v]));
  entries.sort(([a], [b]) => a.localeCompare(b));
  return NextResponse.json({ headers: entries }, { headers: { "Cache-Control": "no-store" } });
}
