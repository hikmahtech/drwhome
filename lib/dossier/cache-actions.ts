"use server";

import { tagFor } from "@/lib/dossier/cache";
import { type DossierCheckId, dossierCheckIds } from "@/lib/dossier/ids";
import { revalidateTag } from "next/cache";

export async function revalidateAllTagsAction(domain: string): Promise<void> {
  for (const id of dossierCheckIds) {
    revalidateTag(tagFor(id, domain));
  }
}
