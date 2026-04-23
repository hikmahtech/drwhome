import { tagFor } from "@/lib/dossier/cache";
import { type DossierCheckId, dossierCheckIds } from "@/lib/dossier/ids";
import { validateDomain } from "@/lib/dossier/validate-domain";
import type { Route } from "next";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") ?? "";
  const v = validateDomain(domain);
  if (!v.ok) return new Response("invalid domain", { status: 400 });

  const checkParam = request.nextUrl.searchParams.get("check");
  if (checkParam && (dossierCheckIds as readonly string[]).includes(checkParam)) {
    const id = checkParam as DossierCheckId;
    revalidateTag(tagFor(id, v.domain));
    const returnTo = request.nextUrl.searchParams.get("return_to");
    redirect((returnTo ?? `/tools/dossier-${id}?domain=${v.domain}`) as Route);
  }

  for (const id of dossierCheckIds) revalidateTag(tagFor(id, v.domain));
  redirect(`/d/${v.domain}`);
}
