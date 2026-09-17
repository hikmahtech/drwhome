import { getContext } from "hono/context-storage";
import type { Child } from "hono/jsx";
import { mustAskConsent } from "../server/consent";

type Props = {
  title: string;
  description: string;
  path: string;
  script?: string;
  children: Child;
};

/**
 * GA id, and whether this visitor must be asked first. Read from the current request through
 * Hono's context storage, so no page has to pass it down. Null when GA is not configured, or
 * when a view is rendered outside a request (unit tests of a sub-app).
 */
function analytics(): { id: string; ask: boolean } | null {
  const id = process.env.GA_MEASUREMENT_ID;
  if (!id) return null;
  try {
    return { id, ask: mustAskConsent(getContext().req.raw.headers) };
  } catch {
    return { id, ask: true };
  }
}

export const SITE = "https://drwho.me";

export function Layout({ title, description, path, script, children }: Props) {
  const ga = analytics();
  return (
    <html lang="en" data-ga={ga?.id} data-consent-ask={ga?.ask ? "1" : undefined}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE}${path}`} />
        <meta name="color-scheme" content="light dark" />
        <link
          rel="preload"
          href="/fonts/archivo.woff2"
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/css/site.css" />
        {script ? <script type="module" src={`/js/${script}.js`} /> : null}
        {ga ? <script type="module" src="/js/analytics.js" /> : null}
      </head>
      <body>
        <header class="mast">
          <div class="wrap">
            <a class="mark" href="/">
              drwho<span>.me</span>
            </a>
            <nav aria-label="Main">
              <a href="/tools">Tools</a>
              <a href="/mcp">MCP server</a>
              <a href="/about">About</a>
            </nav>
          </div>
        </header>
        <main class="wrap">{children}</main>
        <footer class="foot">
          <div class="wrap">
            <span>Free tools. No account, no tracking of what you look up.</span>
            <span>
              Made by the people behind <a href="/go/report?from=footer">Domain Posture</a>.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
