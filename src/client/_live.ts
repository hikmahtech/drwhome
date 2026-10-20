import type { Report } from "../reports/report";
import { renderReport } from "./_render";

/**
 * <dw-live> wraps a form whose answer is worked out in the page as the visitor types.
 * Nothing is sent anywhere. The tool's function gets the form's fields and returns either
 * text to show (with a copy button), a report, or an error line.
 */
export type LiveOutput = { text: string } | { report: Report } | { error: string } | null;

export function defineLive(compute: (fields: FormData) => LiveOutput | Promise<LiveOutput>): void {
  class DwLive extends HTMLElement {
    connectedCallback(): void {
      const form = this.querySelector("form");
      const out = this.querySelector<HTMLElement>("[data-out]");
      if (!form || !out) return;

      // Only the newest run may write to the page: a slow lookup must not overwrite a later one.
      let run = 0;
      const onSubmit = this.getAttribute("on") === "submit";
      const tool = this.getAttribute("tool") ?? "";
      let announced = false;
      // `user` is true when the visitor did something; the first run on page load is not a use.
      const update = async (user = false): Promise<void> => {
        const mine = ++run;
        let result: LiveOutput;
        try {
          result = await compute(new FormData(form));
        } catch {
          result = { error: "Something went wrong in the page." };
        }
        if (mine !== run) return;
        out.replaceChildren(...show(result));
        // For analytics, if loaded. Carries the tool and the outcome, never what was typed.
        // Submit tools announce every run; typing tools once per page, not per keystroke.
        if (user && result && (onSubmit || !announced)) {
          announced = true;
          const tone = "report" in result ? result.report.tone : "error" in result ? "bad" : "good";
          document.dispatchEvent(new CustomEvent("dw:tool", { detail: { tool, tone } }));
        }
      };

      // on="submit" is for tools that make a network call: they run on the button, not per key.
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (onSubmit) void update(true);
      });
      if (onSubmit) return;
      form.addEventListener("input", () => void update(true));
      form.addEventListener("change", () => void update(true));
      // Buttons marked data-again re-run the tool (a UUID generator has no input to type in).
      form.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("[data-again]")) void update(true);
      });
      void update();
    }
  }
  customElements.define("dw-live", DwLive);
}

function show(result: LiveOutput): HTMLElement[] {
  if (!result) return [];
  if ("report" in result) return renderReport(result.report);
  if ("error" in result) {
    const p = document.createElement("p");
    p.className = "verdict";
    p.dataset.tone = "bad";
    p.textContent = result.error;
    return [p];
  }

  const box = document.createElement("div");
  box.className = "outbox";
  const pre = document.createElement("pre");
  pre.textContent = result.text;
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "copy";
  copy.textContent = "Copy";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(result.text);
    copy.textContent = "Copied";
    setTimeout(() => {
      copy.textContent = "Copy";
    }, 1500);
  });
  box.append(pre, copy);
  return [box];
}
