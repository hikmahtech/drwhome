export type EncodeResult = { value: string };
export type DecodeResult = { ok: true; value: string } | { ok: false; error: string };

export function encodeBase64(input: string): EncodeResult {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return { value: btoa(binary) };
}

export function decodeBase64(input: string): DecodeResult {
  const cleaned = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { ok: true, value: new TextDecoder("utf-8", { fatal: false }).decode(bytes) };
  } catch {
    return { ok: false, error: "invalid base64 input" };
  }
}
