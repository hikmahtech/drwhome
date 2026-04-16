type Json = Record<string, unknown>;

export type JwtResult =
  | { ok: true; header: Json; payload: Json; signature: string }
  | { ok: false; error: string };

function b64urlDecodeToString(seg: string): string {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function decodeJwt(input: string): JwtResult {
  const parts = input.trim().split(".");
  if (parts.length !== 3) return { ok: false, error: "expected 3 segments separated by '.'" };
  try {
    const header = JSON.parse(b64urlDecodeToString(parts[0])) as Json;
    const payload = JSON.parse(b64urlDecodeToString(parts[1])) as Json;
    return { ok: true, header, payload, signature: parts[2] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "decode failed" };
  }
}
