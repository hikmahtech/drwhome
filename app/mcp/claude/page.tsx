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
        command: "npx",
        args: ["-y", "mcp-remote", MCP_URL],
      },
    },
  },
  null,
  2,
);

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on claude desktop — install mcp server",
  description:
    "add drwho.me's remote mcp server to claude desktop. 21 tools: 10 domain-dossier checks, 10 developer utilities, one aggregate. copy the config, restart claude.",
  path: "/mcp/claude",
  type: "page",
});

export default function ClaudeMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for Claude Desktop",
    description: "Install drwho.me's remote MCP server in Claude Desktop.",
    url: `${siteUrl()}/mcp/claude`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/claude" />
      <TerminalPrompt>mcp / claude desktop</TerminalPrompt>

      <p className="text-sm">
        add the drwho.me mcp server to claude desktop and claude can call every dossier check and
        developer utility directly from a conversation.
      </p>

      <McpConfigBlock
        client="claude"
        configPath="~/Library/Application Support/Claude/claude_desktop_config.json"
        config={config}
        footnote="macOS path; adjust for Linux/Windows. Restart Claude Desktop after saving. npx mcp-remote bridges the desktop stdio client to the remote http endpoint."
      />

      <section className="space-y-2">
        <h2 className="text-sm text-muted">example prompts</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>&ldquo;what&apos;s the dmarc record for stripe.com?&rdquo;</li>
          <li>&ldquo;run a full dossier on my new domain example.com.&rdquo;</li>
          <li>
            &ldquo;compare tls cert expiry for github.com, gitlab.com, and bitbucket.org.&rdquo;
          </li>
        </ul>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
