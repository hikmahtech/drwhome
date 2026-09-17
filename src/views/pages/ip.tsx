import type { Context } from "hono";
import { lookupIp } from "../../lib/ipinfo";
import { ipRows } from "../../reports/ip";
import type { Report } from "../../reports/report";
import { clientIp } from "../../server/client-ip";
import { ReportView } from "../ReportView";

export default async function WhatIsMyIp({ c }: { c: Context }) {
  const ip = clientIp(c.req.raw.headers);
  let report: Report;
  if (!ip) {
    report = { verdict: "We could not see your address on this request.", tone: "warn", rows: [] };
  } else {
    const info = await lookupIp(ip);
    // The address is always shown, even when the location lookup is unavailable.
    report = {
      verdict: ip,
      tone: "plain",
      rows: info.ok ? ipRows(info.data).slice(1) : [{ label: "Location", value: info.error }],
    };
  }
  return (
    <div class="report first">
      <ReportView report={report} />
      <p class="hint">
        This is the address websites see when you visit them. We do not log it. Location comes from
        ipinfo.io.
      </p>
    </div>
  );
}
