// lib/dossier/cache.ts
import { type DossierCheckId, dossierCheckIds } from "@/lib/dossier/ids";
import type { CheckResult } from "@/lib/dossier/types";
import { revalidateTag, unstable_cache } from "next/cache";

export function tagFor(id: DossierCheckId, domain: string): string {
  return `dossier:${id}:${domain}`;
}

type CheckFn<T> = (domain: string) => Promise<CheckResult<T>>;

export function withCache<T>(
  fn: CheckFn<T>,
  opts: { id: DossierCheckId; ttlSeconds: number },
): CheckFn<T> {
  return async (domain: string) => {
    const cached = unstable_cache(async (d: string) => fn(d), ["dossier", opts.id, domain], {
      revalidate: opts.ttlSeconds,
      tags: [tagFor(opts.id, domain)],
    });
    return cached(domain);
  };
}

export async function revalidateAllTags(domain: string): Promise<void> {
  for (const id of dossierCheckIds) {
    revalidateTag(tagFor(id, domain));
  }
}
