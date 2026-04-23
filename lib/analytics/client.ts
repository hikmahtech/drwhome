type GtagArg = string | number | boolean | Date | Record<string, unknown>;
type GtagFn = (...args: GtagArg[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

function emit(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

export function trackToolExecuted(slug: string, success: boolean): void {
  emit("tool_executed", { tool_slug: slug, success });
}

export function trackDossierViewed(domain: string): void {
  emit("dossier_viewed", { domain });
}

export function trackDossierShared(domain: string): void {
  emit("dossier_shared", { domain });
}

export function trackMcpInstallClick(client: string): void {
  emit("mcp_install_click", { client });
}

export function trackBlogToolClick(postSlug: string, toolSlug: string): void {
  emit("blog_tool_click", { post_slug: postSlug, tool_slug: toolSlug });
}
