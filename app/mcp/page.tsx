import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findTool } from "@/content/tools";
import { mcpTools } from "@/lib/mcp/tools";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

const paywallEnabled = process.env.MCP_PAYWALL_ENABLED !== "false";

export const metadata: Metadata = pageMetadata({
  title: "mcp endpoint",
  description: paywallEnabled
    ? "Remote MCP endpoint for drwho.me. Point Claude Desktop or any MCP client at https://drwho.me/mcp/mcp. Paid tier coming soon — join the waitlist."
    : "Remote MCP endpoint for drwho.me. Point Claude Desktop or any MCP client at https://drwho.me/mcp/mcp. Free and open while in beta.",
  path: "/mcp",
  type: "page",
});

const MCP_URL = "https://drwho.me/mcp/mcp";

const claudeConfig = JSON.stringify(
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

export default function McpLanding() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP endpoint",
    description: paywallEnabled
      ? "Remote MCP server at drwho.me. Streamable HTTP transport. Paid tier — join the waitlist."
      : "Remote MCP server at drwho.me. Streamable HTTP transport. Free and open while in beta.",
    url: `${siteUrl()}/mcp`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp" />
      <TerminalPrompt>mcp</TerminalPrompt>
      {paywallEnabled ? (
        <p className="text-sm">
          <span className="text-muted">drwho.me</span> exposes a remote MCP endpoint so AI clients
          like Claude Desktop and ChatGPT can call the same tools this site offers in the browser.
          The endpoint is <span className="text-muted">paid</span>: the handshake and tool listing
          are open so your client can discover what&apos;s available, but every{" "}
          <code>tools/call</code> returns a <code>402</code> + MCP error pointing back here. Join
          the waitlist below — we ping you when the paid tier opens.
        </p>
      ) : (
        <p className="text-sm">
          <span className="text-muted">drwho.me</span> exposes a remote MCP endpoint so AI clients
          like Claude Desktop and ChatGPT can call the same tools this site offers in the browser.
          The endpoint is <span className="text-muted">open and free</span> while in beta — point
          your client at the URL below and every tool is callable.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm text-muted">endpoint</h2>
        <TerminalCard label="url">{MCP_URL}</TerminalCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">claude desktop config</h2>
        <TerminalCard label="claude_desktop_config.json">
          <pre className="text-xs whitespace-pre overflow-x-auto">{claudeConfig}</pre>
        </TerminalCard>
        <p className="text-xs text-muted">
          Add this to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
          (macOS) or the equivalent on Linux/Windows, then restart Claude Desktop. The npx{" "}
          <code>mcp-remote</code> bridge is required because the Desktop app config only accepts
          stdio-style entries — it runs as a local proxy to the remote endpoint. Other clients
          (Cursor, ChatGPT connectors) may accept the URL directly.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">tools advertised ({mcpTools.length})</h2>
        <ul className="text-sm space-y-1 list-none p-0">
          {mcpTools.map((t) => {
            const web = findTool(t.slug);
            return (
              <li key={t.name} className="border-b last:border-b-0 py-2">
                <code className="text-accent">{t.name}</code> — {t.description}
                {web && (
                  <>
                    {" "}
                    <Link href={`/tools/${web.slug}` as Route} className="text-muted">
                      (try in browser)
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {paywallEnabled && (
        <section className="space-y-3">
          <h2 className="text-sm text-muted">waitlist</h2>
          <p className="text-sm">
            drop your email and we&apos;ll tell you when paid access opens. no other uses.
          </p>
          <WaitlistForm />
        </section>
      )}

      <JsonLd data={jsonLd} />
    </article>
  );
}
