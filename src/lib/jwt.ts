export type JwtResult =
  | { ok: true; header: unknown; payload: unknown; signature: string }
  | { ok: false; error: string };

function b64urlDecodeToString(seg: string): string {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/**
 * Splits and decodes a JWT's header and payload. Never checks the signature — there is no key
 * to check it with here, and nothing typed into the page is ever sent anywhere.
 */
export function decodeJwt(token: string): JwtResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `A JWT has 3 parts separated by '.'. This has ${parts.length}.`,
    };
  }

  let header: unknown;
  try {
    header = JSON.parse(b64urlDecodeToString(parts[0]));
  } catch {
    return { ok: false, error: "The header is not valid base64url-encoded JSON." };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(b64urlDecodeToString(parts[1]));
  } catch {
    return { ok: false, error: "The payload is not valid base64url-encoded JSON." };
  }

  return { ok: true, header, payload, signature: parts[2] };
}
