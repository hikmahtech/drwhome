export function extractClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "unknown";
}
