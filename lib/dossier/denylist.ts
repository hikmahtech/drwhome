/**
 * Static list of abuse-prone dossier targets. Populated reactively.
 * Edits here ship on the next deploy — no DB, no admin UI.
 * Match is EXACT (case-insensitive, trailing-dot-tolerant). No subdomain wildcarding.
 */
export const DENYLIST: ReadonlySet<string> = new Set([
  // Seed with a single obviously-hostile sample so the type & tests have something to bind to.
  // Add real entries as incidents happen.
  "phishy-example-abuse.test",
]);

const DENIAL_REASON = "this domain is on the drwho.me denylist for abuse reasons";

export type DenyResult = { denied: true; reason: string } | { denied: false };

export function isDenied(domain: string): DenyResult {
  const normalised = domain.trim().toLowerCase().replace(/\.$/, "");
  return DENYLIST.has(normalised) ? { denied: true, reason: DENIAL_REASON } : { denied: false };
}
