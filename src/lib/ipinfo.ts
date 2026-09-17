export type IpInfo = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  timezone?: string;
};
export type IpInfoResult = { ok: true; data: IpInfo } | { ok: false; error: string };

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;
const DAY = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: IpInfo }>();

export const looksLikeIp = (s: string): boolean =>
  s.length <= 45 && (IPV4.test(s) || (s.includes(":") && IPV6.test(s)));

/**
 * Looks an address up on ipinfo.io. The token stays on the server. Answers are kept for a day:
 * geolocation rarely changes, and the free ipinfo plan is metered.
 */
export async function lookupIp(
  ip: string,
  token = process.env.IPINFO_TOKEN ?? "",
): Promise<IpInfoResult> {
  if (!looksLikeIp(ip)) return { ok: false, error: "That is not an IPv4 or IPv6 address." };
  if (!token) return { ok: false, error: "IP lookup is not configured on this server." };

  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < DAY) return { ok: true, data: hit.data };

  try {
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `The lookup service answered ${res.status}.` };
    const data = (await res.json()) as IpInfo & { bogon?: boolean };
    if (data.bogon) return { ok: false, error: "That address is private or reserved." };
    if (cache.size > 5000) cache.clear();
    cache.set(ip, { at: Date.now(), data });
    return { ok: true, data };
  } catch {
    return { ok: false, error: "The lookup service did not answer." };
  }
}
