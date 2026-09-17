export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

export function encodeBase64(input: string, opts: { urlSafe?: boolean } = {}): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const out = btoa(binary);
  return opts.urlSafe ? out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : out;
}

/** Accepts standard and URL-safe input, with or without padding or line breaks. */
export function decodeBase64(input: string): DecodeResult {
  const cleaned = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    // fatal: bytes that are not UTF-8 are reported, not silently replaced with U+FFFD.
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "This is not valid base64, or it does not decode to text." };
  }
}
