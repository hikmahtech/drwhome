export type UrlDecodeResult = { ok: true; value: string } | { ok: false; error: string };

/** Percent-encodes a string component the way encodeURIComponent does. */
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): UrlDecodeResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "This is not valid percent-encoding." };
  }
}
