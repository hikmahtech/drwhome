import type { Report } from "../reports/report";
import { el, renderReport } from "./_render";

/**
 * <dw-check tool="slug"> wraps a domain check's form and its report area.
 * The URL is the state: submitting rewrites ?domain=, and a page opened with ?domain= runs at once.
 */
export function defineTool(run: (domain: string, tool: string) => Promise<Report>): void {
  class DwCheck extends HTMLElement {
    connectedCallback(): void {
      const form = this.querySelector("form");
      const input = this.querySelector<HTMLInputElement>("input[name=domain]");
      const button = this.querySelector("button");
      const out = this.querySelector<HTMLElement>("[data-report]");
      if (!form || !input || !button || !out) return;
      const tool = this.getAttribute("tool") ?? "";

      const go = async (domain: string): Promise<void> => {
        button.disabled = true;
        out.replaceChildren(el("p", "hint", "Checking…"));
        try {
          const report = await run(domain, tool);
          out.replaceChildren(...renderReport(report), more(domain, tool));
          // For analytics, if loaded. Carries the tool and the outcome, never the domain.
          document.dispatchEvent(
            new CustomEvent("dw:tool", { detail: { tool, tone: report.tone } }),
          );
        } catch {
          out.replaceChildren(el("p", "hint", "Something went wrong in the page. Try again."));
        } finally {
          button.disabled = false;
        }
      };

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const domain = input.value.trim();
        if (!domain) return;
        const url = new URL(location.href);
        url.searchParams.set("domain", domain);
        history.replaceState(null, "", url);
        void go(domain);
      });

      // The server already rendered a report for a visitor without JavaScript: leave it.
      const initial = new URL(location.href).searchParams.get("domain");
      if (initial && out.childElementCount === 0) void go(initial);
    }
  }
  customElements.define("dw-check", DwCheck);
}

/** The band under a result. It links to a page on THIS site that explains Domain Posture. */
function more(domain: string, tool: string): HTMLElement {
  const band = el("aside", "more");
  const text = el("div", "");
  text.append(
    el("h2", "", `This is one check of 18 for ${domain}.`),
    el(
      "p",
      "",
      "Domain Posture, our sister site, runs all 18, grades each one and tells you what to fix first.",
    ),
  );
  const link = el("a", "", "What the full report covers") as HTMLAnchorElement;
  link.href = `/domain-report?domain=${encodeURIComponent(domain)}&from=${encodeURIComponent(tool)}`;
  band.append(text, link);
  return band;
}
