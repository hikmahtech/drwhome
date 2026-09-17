/**
 * Domains we refuse to check, added when abuse happens. Exact match, case-insensitive,
 * trailing dot ignored. No subdomain wildcards. Edits ship with the next deploy.
 */
export const DENYLIST: ReadonlySet<string> = new Set<string>([]);

export function isDenied(domain: string): boolean {
  return DENYLIST.has(domain.trim().toLowerCase().replace(/\.$/, ""));
}
