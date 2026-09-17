/**
 * The visitor's address. Only cf-connecting-ip is trusted. The site sits behind Cloudflare and a
 * reverse proxy, and the proxy overwrites x-forwarded-for with its own upstream address, so
 * every visitor would share one value there.
 */
export function clientIp(headers: Headers): string | null {
  const ip = headers.get("cf-connecting-ip")?.trim();
  return ip && ip.length <= 45 ? ip : null;
}
