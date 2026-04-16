export type IpInfo = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  timezone?: string;
};

export type IpLookupResult = { ok: true; data: IpInfo } | { ok: false; error: string };

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

export async function lookupIp(ip: string, token: string): Promise<IpLookupResult> {
  const trimmed = ip.trim();
  if (!trimmed) return { ok: false, error: "ip required" };
  if (!IPV4.test(trimmed) && !IPV6.test(trimmed)) return { ok: false, error: "invalid ip format" };
  if (!token) return { ok: false, error: "ipinfo token not configured" };

  const res = await fetch(`https://ipinfo.io/${trimmed}?token=${token}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return { ok: false, error: `upstream error: ${res.status}` };
  const data = (await res.json()) as IpInfo;
  return { ok: true, data };
}
