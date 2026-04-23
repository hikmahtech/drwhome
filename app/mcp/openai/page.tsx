import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

const MCP_URL = "https://drwho.me/mcp/mcp";

export const metadata: Metadata = pageMetadata({
  title: "drwho.me on openai / chatgpt — mcp and custom gpts",
  description:
    "use drwho.me's tools from chatgpt via mcp connectors or as a custom gpt action. 21 network and developer tools over streamable http.",
  path: "/mcp/openai",
  type: "page",
});

export default function OpenaiMcp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP for OpenAI / ChatGPT",
    description: "Use drwho.me's MCP endpoint from ChatGPT via MCP connectors or a Custom GPT.",
    url: `${siteUrl()}/mcp/openai`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp/openai" />
      <TerminalPrompt>mcp / openai + chatgpt</TerminalPrompt>

      <p className="text-sm">
        chatgpt supports mcp connectors natively for business and enterprise accounts; for free /
        plus accounts, wrap the endpoint as a custom gpt action.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">option 1: mcp connector (business / enterprise)</h2>
        <p className="text-sm">
          settings → connectors → add → &ldquo;custom mcp server&rdquo; → point at the url below.
          mcp connectors on chatgpt require streamable-http, which drwho.me speaks natively.
        </p>
        <TerminalCard label="mcp url">{MCP_URL}</TerminalCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">option 2: custom gpt action</h2>
        <p className="text-sm">
          custom gpts accept openapi 3.1 action definitions. wrap drwho.me&apos;s mcp endpoint with
          a minimal relay (any function-as-a-service works) that exposes each tool as an http post
          action, or use one of the mcp-to-openapi proxies available on github.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">tools advertised</h2>
        <p className="text-sm">
          see the <Link href={"/mcp" as Route}>mcp landing page</Link> for the full list of 21
          tools. all of them are callable from both flows above.
        </p>
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
