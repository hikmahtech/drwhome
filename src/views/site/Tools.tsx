import { tools } from "../../content/tools";
import { Layout } from "../Layout";
import { ToolList } from "../ToolList";

export function Tools() {
  return (
    <Layout
      title="All tools — drwho.me"
      description="Every free network and developer tool on drwho.me, grouped by kind, with what runs in your browser and what runs on our server."
      path="/tools"
    >
      <header class="tool-head">
        <div class="n" aria-hidden="true">
          {tools.length}
        </div>
        <div class="t">
          <span class="label">No account, no sign-up</span>
          <h1>All tools</h1>
          <p>
            Domain, email, DNS and developer tools. Most run in your browser, so the lookup never
            reaches our server.
          </p>
        </div>
      </header>
      <div class="rule-top">
        <ToolList />
      </div>
    </Layout>
  );
}
