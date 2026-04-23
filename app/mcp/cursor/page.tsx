import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { McpConfigBlock } from "@/components/mcp/McpConfigBlock";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";

const MCP_URL = "https://drwho.me/mcp/mcp";

const config = JSON.stringify(
  {
    mcpServers: {
      "drwho.me": {
        url: MCP_URL,
      },
    },
  },
  null,
  2,
);

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on cursor — install mcp server",
  description:
    "add drwho.me's remote mcp server to cursor. 21 network + developer tools available inline in your editor chat.",
  path: "/mcp/cursor",
  type: "page",
});

export default function CursorMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for Cursor",
    description: "Install drwho.me's remote MCP server in Cursor.",
    url: `${siteUrl()}/mcp/cursor`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/cursor" />
      <TerminalPrompt>mcp / cursor</TerminalPrompt>

      <p className="text-sm">
        cursor supports streamable-http mcp servers natively, so no local bridge is needed — point
        it at the url and restart.
      </p>

      <McpConfigBlock
        client="cursor"
        configPath="~/.cursor/mcp.json"
        config={config}
        footnote="Cursor hot-reloads mcp.json changes on most platforms. If the tools don't appear, restart Cursor. Project-scoped configs can also live at .cursor/mcp.json inside the workspace root."
      />

      <section className="space-y-2">
        <h2 className="text-sm text-muted">example prompts</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>&ldquo;check the dns for the domain in this config file.&rdquo;</li>
          <li>&ldquo;decode the base64 string on line 42 of this file.&rdquo;</li>
          <li>&ldquo;what&apos;s the security-headers posture of the url in my env var?&rdquo;</li>
        </ul>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
