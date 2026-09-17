import { parseUserAgent } from "../lib/user-agent";
import type { Report, Row } from "../reports/report";
import { defineLive } from "./_live";

// Pre-fill with the visitor's own user agent when the box is empty, before <dw-live> upgrades
// and runs its first compute.
const prefill = document.querySelector<HTMLTextAreaElement>(
  'dw-live[tool="user-agent"] textarea[name="input"]',
);
if (prefill && !prefill.value) prefill.value = navigator.userAgent;

defineLive((f) => {
  const input = String(f.get("input") ?? "").trim();
  if (!input) return null;

  const r = parseUserAgent(input);
  const browser = [r.browser.name, r.browser.version].filter(Boolean).join(" ") || "Unknown";
  const os = [r.os.name, r.os.version].filter(Boolean).join(" ") || "Unknown";
  const device =
    [r.device.vendor, r.device.model].filter(Boolean).join(" ") || r.device.type || "Desktop";

  const rows: Row[] = [
    { label: "Browser", value: browser },
    { label: "Operating system", value: os },
    { label: "Device", value: device },
    { label: "Rendering engine", value: r.engine.name || "Unknown" },
  ];
  const report: Report = { verdict: browser, tone: "plain", rows };
  return { report };
});
