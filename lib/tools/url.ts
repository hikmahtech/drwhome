export type UrlEncodeResult = { value: string };
export type UrlDecodeResult = { ok: true; value: string } | { ok: false; error: string };

export function encodeUrl(input: string): UrlEncodeResult {
  return { value: encodeURIComponent(input) };
}

export function decodeUrl(input: string): UrlDecodeResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "malformed URL encoding" };
  }
}
