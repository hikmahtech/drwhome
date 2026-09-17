import { Hono } from "hono";
import { isReady } from "../content/ready";
import { tools } from "../content/tools";
import { SITE } from "../views/Layout";
import { About } from "../views/site/About";
import type { McpTool } from "../views/site/Mcp";
import { Mcp } from "../views/site/Mcp";
import { Monitoring } from "../views/site/Monitoring";
import { Privacy } from "../views/site/Privacy";
import { Tools } from "../views/site/Tools";

/** Every path this router serves. A test asserts none of these falls through to the legacy redirect. */
export const OWNED_PATHS: string[] = [
  "/tools",
  "/mcp",
  "/monitoring",
  "/about",
  "/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
];

export const site = new Hono();

site.get("/tools", (c) => c.html(<Tools />));

site.get("/mcp", async (c) => {
  // src/mcp/tools.ts is another agent's file and may not exist yet: an opaque (non-literal)
  // specifier keeps TypeScript from resolving it, so this compiles either way.
  const modPath: string = "../mcp/tools";
  const mod = (await import(modPath).catch(() => null)) as { mcpTools: McpTool[] } | null;
  return c.html(<Mcp mcpTools={mod?.mcpTools ?? null} />);
});

site.get("/monitoring", (c) => c.html(<Monitoring />));
site.get("/about", (c) => c.html(<About />));
site.get("/privacy", (c) => c.html(<Privacy />));

site.get("/robots.txt", (c) => {
  c.header("content-type", "text/plain; charset=utf-8");
  return c.body(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /go/",
      "Disallow: /api/",
      `Sitemap: ${SITE}/sitemap.xml`,
      "",
    ].join("\n"),
  );
});

/** Generated from the tool list, never typed by hand, so a new ready tool appears here on its own. */
site.get("/sitemap.xml", (c) => {
  const readyToolPaths = tools.filter(isReady).map((t) => `/tools/${t.slug}`);
  const paths = [
    "/",
    "/tools",
    ...readyToolPaths,
    "/mcp",
    "/domain-report",
    "/monitoring",
    "/about",
    "/privacy",
  ];
  const urls = paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join("\n");
  c.header("content-type", "application/xml; charset=utf-8");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
});

/** llms.txt convention: an H1, a blockquote summary, then link sections. Plain text, not HTML. */
site.get("/llms.txt", (c) => {
  const ready = tools.filter(isReady);
  const lines = [
    "# drwho.me",
    "",
    "> Free network, email, DNS and developer tools, plus a free MCP server for AI agents.",
    "",
    "## Tools",
    "",
    ...ready.map((t) => `- [${t.name}](${SITE}/tools/${t.slug}): ${t.summary}`),
    "",
    "## MCP",
    "",
    `- [MCP server](${SITE}/mcp): ${SITE}/mcp/mcp — streamable HTTP, no key, 60 tool calls an hour.`,
    "",
  ];
  c.header("content-type", "text/plain; charset=utf-8");
  return c.body(lines.join("\n"));
});
