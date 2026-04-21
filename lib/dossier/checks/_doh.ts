export type DohAnswer = { name: string; type: number; TTL: number; data: string };

export type DohResult = { ok: true; answers: DohAnswer[] } | { ok: false; reason: string };

type DohBody = { Status: number; Answer?: DohAnswer[] };

export async function dohFetch(
  name: string,
  type: string,
  init: { signal?: AbortSignal } = {},
): Promise<DohResult> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: init.signal,
  });
  if (!res.ok) return { ok: false, reason: `upstream ${res.status}` };
  const body = (await res.json()) as DohBody;
  if (body.Status !== 0) return { ok: false, reason: `doh status ${body.Status}` };
  return { ok: true, answers: body.Answer ?? [] };
}
