import { tools } from "@/content/tools";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET(): Response {
  const url = siteUrl();
  const lines = [
    "# drwho.me",
    "",
    "> online developer utilities and a remote MCP endpoint. 10 tools for base64, jwt, dns, uuid, url, json, user-agent, and ip lookup. all callable over http (web) or mcp (claude desktop, cursor, windsurf, chatgpt connectors). open, no signup, no logs.",
    "",
    "## tools",
    "",
    ...tools.map((t) => `- [${t.name}](${url}/tools/${t.slug}): ${t.description}`),
    "",
    "## mcp",
    "",
    `- [endpoint](${url}/mcp/mcp): streamable http transport for ai clients`,
    `- [landing page](${url}/mcp): setup instructions and tool list`,
    `- [server.json](${url}/server.json): mcp server manifest`,
    "",
    "## site",
    "",
    `- [home](${url}/): browsable tool grid`,
    `- [blog](${url}/blog): technical notes on the tools and mcp`,
    `- [about](${url}/about): maintainer and mission`,
    `- [privacy](${url}/privacy): privacy policy (cookieless analytics, no accounts)`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
