import type { Context } from "hono";
import { lookupIp } from "../../lib/ipinfo";
import { ipRows } from "../../reports/ip";
import type { Report } from "../../reports/report";
import { clientIp } from "../../server/client-ip";
import { createLimiter } from "../../server/rate-limit";
import { ReportView } from "../ReportView";

const HOUR = 60 * 60 * 1000;
// Every lookup costs an upstream ipinfo.io call, so it is metered per visitor — same shape as
// the domain checks in src/app.tsx.
const limiter = createLimiter({ perWindow: 30, windowMs: HOUR, anonymousPerWindow: 15 });

export default async function IpLookup({ c }: { c: Context }) {
  const raw = c.req.query("ip")?.trim();
  let report: Report | undefined;

  if (raw) {
    const limit = limiter.take(clientIp(c.req.raw.headers));
    if (!limit.ok) {
      report = {
        verdict: "Too many lookups from your address. Try again later.",
        tone: "warn",
        rows: [],
      };
    } else {
      const info = await lookupIp(raw);
      report = info.ok
        ? { verdict: info.data.ip, tone: "plain", rows: ipRows(info.data).slice(1) }
        : { verdict: info.error, tone: "warn", rows: [] };
    }
  }

  return (
    <>
      <form class="ask" method="get">
        <input
          name="ip"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck={false}
          placeholder="8.8.8.8"
          aria-label="IP address"
          value={raw ?? ""}
          required
        />
        <button type="submit">Look up</button>
      </form>
      <div class="report">{report ? <ReportView report={report} /> : null}</div>
      <p class="hint">We do not log the address you look up. Location comes from ipinfo.io.</p>
    </>
  );
}
