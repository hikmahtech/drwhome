import { tagFor } from "@/lib/dossier/cache";
import { dossierCheckIds } from "@/lib/dossier/ids";
import { validateDomain } from "@/lib/dossier/validate-domain";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") ?? "";
  const v = validateDomain(domain);
  if (!v.ok) {
    return new Response("invalid domain", { status: 400 });
  }

  for (const id of dossierCheckIds) {
    revalidateTag(tagFor(id, v.domain));
  }

  redirect(`/d/${v.domain}`);
}
