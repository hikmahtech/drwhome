export type ValidateResult = { ok: true; domain: string } | { ok: false; reason: string };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const BANNED_TLDS = new Set(["local", "internal", "test", "example", "localhost"]);
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const HAS_IPV6 = /:/;

export function validateDomain(raw: string): ValidateResult {
  if (typeof raw !== "string") return { ok: false, reason: "not a string" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > 253) return { ok: false, reason: "too long" };

  // Reject anything URL-ish. Disallow ports, paths, queries, userinfo.
  if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("@") || trimmed.includes(":")) {
    if (HAS_IPV6.test(trimmed)) return { ok: false, reason: "ipv6 not allowed" };
    return { ok: false, reason: "must be a bare domain (no scheme, port, path, userinfo)" };
  }

  if (IPV4.test(trimmed)) return { ok: false, reason: "ip addresses not allowed" };

  const domain = trimmed.toLowerCase();
  const labels = domain.split(".");
  if (labels.length < 2) return { ok: false, reason: "must have at least two labels" };
  for (const l of labels) {
    if (l.length === 0) return { ok: false, reason: "empty label" };
    if (!LABEL.test(l)) return { ok: false, reason: `invalid label: ${l}` };
  }

  const tld = labels[labels.length - 1];
  if (BANNED_TLDS.has(tld)) return { ok: false, reason: `banned tld: .${tld}` };
  if (domain === "localhost") return { ok: false, reason: "localhost not allowed" };

  return { ok: true, domain };
}
