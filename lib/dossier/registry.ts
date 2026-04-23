// lib/dossier/registry.ts
import { withCache } from "@/lib/dossier/cache";
import { corsCheck } from "@/lib/dossier/checks/cors";
import { dkimCheck } from "@/lib/dossier/checks/dkim";
import { dmarcCheck } from "@/lib/dossier/checks/dmarc";
import { dnsCheck } from "@/lib/dossier/checks/dns";
import { headersCheck } from "@/lib/dossier/checks/headers";
import { mxCheck } from "@/lib/dossier/checks/mx";
import { redirectsCheck } from "@/lib/dossier/checks/redirects";
import { spfCheck } from "@/lib/dossier/checks/spf";
import { tlsCheck } from "@/lib/dossier/checks/tls";
import { webSurfaceCheck } from "@/lib/dossier/checks/web-surface";
import { type DossierCheckId, dossierCheckIds } from "@/lib/dossier/ids";
import type { CheckResult } from "@/lib/dossier/types";

// Re-export so existing imports of DossierCheckId from registry keep working.
export { dossierCheckIds, type DossierCheckId };

export type DossierCheck = {
  id: DossierCheckId;
  title: string;
  toolSlug: string;
  ttlSeconds: number;
  run: (domain: string) => Promise<CheckResult<unknown>>; // cached
  runUncached: (domain: string) => Promise<CheckResult<unknown>>; // raw
};

type Raw = {
  id: DossierCheckId;
  title: string;
  toolSlug: string;
  ttlSeconds: number;
  fn: (domain: string) => Promise<CheckResult<unknown>>;
};

const raw: Raw[] = [
  { id: "dns", title: "dns", toolSlug: "dns-records-lookup", ttlSeconds: 3600, fn: dnsCheck },
  { id: "mx", title: "mx", toolSlug: "mx-lookup", ttlSeconds: 3600, fn: mxCheck },
  { id: "spf", title: "spf", toolSlug: "spf-checker", ttlSeconds: 3600, fn: spfCheck },
  { id: "dmarc", title: "dmarc", toolSlug: "dmarc-checker", ttlSeconds: 3600, fn: dmarcCheck },
  {
    id: "dkim",
    title: "dkim",
    toolSlug: "dkim-lookup",
    ttlSeconds: 900,
    fn: (d: string) => dkimCheck(d),
  },
  { id: "tls", title: "tls", toolSlug: "tls-certificate-checker", ttlSeconds: 21600, fn: tlsCheck },
  {
    id: "redirects",
    title: "redirects",
    toolSlug: "redirect-checker",
    ttlSeconds: 900,
    fn: redirectsCheck,
  },
  {
    id: "headers",
    title: "headers",
    toolSlug: "security-headers-checker",
    ttlSeconds: 900,
    fn: headersCheck,
  },
  {
    id: "cors",
    title: "cors",
    toolSlug: "cors-checker",
    ttlSeconds: 900,
    fn: (d: string) => corsCheck(d),
  },
  {
    id: "web-surface",
    title: "web-surface",
    toolSlug: "web-surface-inspector",
    ttlSeconds: 900,
    fn: webSurfaceCheck,
  },
];

export const dossierChecks: DossierCheck[] = raw.map((r) => ({
  id: r.id,
  title: r.title,
  toolSlug: r.toolSlug,
  ttlSeconds: r.ttlSeconds,
  run: withCache(r.fn, { id: r.id, ttlSeconds: r.ttlSeconds }),
  runUncached: r.fn,
}));

export function findCheck(id: DossierCheckId): DossierCheck | undefined {
  return dossierChecks.find((c) => c.id === id);
}

export function findCheckByToolSlug(toolSlug: string): DossierCheck | undefined {
  return dossierChecks.find((c) => c.toolSlug === toolSlug);
}
