/**
 * Google Analytics 4 with Consent Mode. Loaded only when the server put a measurement id on
 * <html data-ga>. No inline script, so the content security policy stays strict.
 *
 * What is sent: page views, which tool ran and whether it found a problem, and clicks on links
 * to Domain Posture. Never the domain, address or text a visitor typed.
 */
type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const root = document.documentElement;
const id = root.dataset.ga;
const KEY = "dw-consent";

function stored(): "granted" | "denied" | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

if (id) {
  window.dataLayer = window.dataLayer || [];
  const gtag: Gtag = gtagShim;

  const ask = root.dataset.consentAsk === "1";
  const choice = stored();
  const state = choice ?? (ask ? "denied" : "granted");
  gtag("consent", "default", {
    analytics_storage: state,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  // No Google Signals and no ad personalisation: this site counts visits, nothing more. It also
  // keeps the tag off www.google.com, which the content security policy does not allow.
  gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);

  // Tools announce a finished run with a DOM event, so they never import this file.
  document.addEventListener("dw:tool", (e) => {
    const { tool, tone } = (e as CustomEvent<{ tool: string; tone: string }>).detail;
    gtag("event", "tool_executed", { tool_slug: tool, result_tone: tone });
  });

  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/go/"]');
    if (!link) return;
    const url = new URL(link.href);
    gtag("event", "domain_posture_click", {
      target: url.pathname.replace("/go/", ""),
      from: url.searchParams.get("from") ?? "",
    });
  });

  if (ask && !choice) showBar(gtag);
}

/**
 * gtag.js tells commands from data by checking for a real `arguments` object, so this must be a
 * plain function that pushes `arguments` itself. An arrow function or a rest array breaks it
 * without any error: events are queued and then ignored.
 */
function gtagShim(): void {
  // biome-ignore lint/style/noArguments: gtag.js requires the arguments object, see above
  window.dataLayer.push(arguments);
}

function showBar(gtag: Gtag): void {
  const bar = document.createElement("div");
  bar.className = "consent";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Analytics consent");
  const text = document.createElement("p");
  text.textContent =
    "We would like to count visits with Google Analytics. We never record what you look up.";
  const more = document.createElement("a");
  more.href = "/privacy";
  more.textContent = "Privacy";
  text.append(" ", more);

  const decide = (value: "granted" | "denied"): void => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // Storage blocked: the choice holds for this page only.
    }
    gtag("consent", "update", { analytics_storage: value });
    bar.remove();
  };
  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "btn";
  yes.textContent = "Allow";
  yes.addEventListener("click", () => decide("granted"));
  const no = document.createElement("button");
  no.type = "button";
  no.className = "btn";
  no.textContent = "No thanks";
  no.addEventListener("click", () => decide("denied"));

  bar.append(text, no, yes);
  document.body.append(bar);
}

export {};
