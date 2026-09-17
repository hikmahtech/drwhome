import { tools } from "../content/tools";
import { Layout } from "./Layout";
import { ToolList } from "./ToolList";

export function Home() {
  return (
    <Layout
      title="drwho.me — free network and developer tools"
      description="Free DNS, email, TLS and developer tools that run in your browser, plus a free MCP server for AI agents."
      path="/"
    >
      <section class="lede">
        <h1>Free tools for domains, mail and the web.</h1>
        <p>
          Most of them run in your browser, so what you look up stays with you. The same tools are
          open to AI agents through a free MCP server.
        </p>
        <div class="count">
          <b>{tools.length}</b>
          <span class="label">tools, no account</span>
        </div>
      </section>
      <ToolList />
    </Layout>
  );
}
