import {
  DEFAULT_DKIM_SELECTORS,
  type DkimCheckData,
  type DkimSelectorResult,
} from "@hikmahtech/dossier-checks";
import type { Row } from "./report";

const isFound = (s: DkimSelectorResult): s is Extract<DkimSelectorResult, { status: "found" }> =>
  s.status === "found";

function parseTags(record: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    out[k.trim()] = rest.join("=").trim();
  }
  return out;
}

/**
 * Rough RSA modulus size from the base64-encoded public key. The DER
 * overhead for a SubjectPublicKeyInfo wrapping an RSA key with a 65537
 * exponent is about 38 bytes; subtracting it and rounding to the nearest
 * size a key generator actually produces keeps a few bytes of ASN.1
 * padding from turning into a nonsense number like "1011-bit".
 */
function approxRsaBits(pBase64: string): number | null {
  const clean = pBase64.replace(/\s+/g, "");
  if (!clean) return null;
  try {
    const bytes = atob(clean).length;
    const raw = (bytes - 38) * 8;
    if (raw <= 0) return null;
    const common = [512, 1024, 2048, 3072, 4096];
    return common.reduce((best, c) => (Math.abs(c - raw) < Math.abs(best - raw) ? c : best));
  } catch {
    return null;
  }
}

function keyDescription(record: string): string {
  const tags = parseTags(record);
  const type = (tags.k ?? "rsa").toLowerCase();
  if (!tags.p) return type;
  if (type === "ed25519") return `${type}, 256-bit`;
  if (type === "rsa") {
    const bits = approxRsaBits(tags.p);
    return bits ? `${type}, ~${bits}-bit` : type;
  }
  return type;
}

/** Only the selectors that were actually found — the probe list is 22 guesses, not a report. */
export function dkimRows({ selectors }: DkimCheckData): Row[] {
  const rows: Row[] = selectors
    .filter(isFound)
    .map((s) => ({ label: s.selector, value: keyDescription(s.record) }));
  rows.push({
    label: "Selectors probed",
    value: String(DEFAULT_DKIM_SELECTORS.length),
    note: "Common provider names only. A selector outside this list reads as not found even when DKIM is set up.",
  });
  return rows;
}
