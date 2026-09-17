import { browserChecks } from "../checks/browser";
import type { Report } from "../reports/report";
import { defineTool } from "./_tool";

/** One script for every domain check: run it here if the browser can, else ask the server. */
defineTool(async (domain, tool): Promise<Report> => {
  const local = browserChecks.find((c) => c.id === tool);
  if (local) return local.run(domain);

  const res = await fetch(`/api/v1/check/${tool}?domain=${encodeURIComponent(domain)}`);
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after") ?? 60);
    return {
      verdict: `Too many checks from your address. Try again in ${Math.ceil(wait / 60)} minutes.`,
      tone: "warn",
      rows: [],
    };
  }
  if (!res.ok) return { verdict: "The server could not run this check.", tone: "bad", rows: [] };
  return (await res.json()) as Report;
});
