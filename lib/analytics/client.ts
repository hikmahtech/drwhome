type GtagArg = string | number | boolean | Date | Record<string, unknown>;
type GtagFn = (...args: GtagArg[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export function trackToolExecuted(slug: string, success: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "tool_executed", { tool_slug: slug, success });
}
