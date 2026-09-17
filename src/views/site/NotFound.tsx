import { Layout } from "../Layout";

/**
 * For paths inside drwho.me's own space that miss (/go/<unknown>, /tools/<unknown>). The
 * site-wide catch-all still sends everything else to Domain Posture on purpose.
 */
export function NotFound({ path }: { path: string }) {
  return (
    <Layout
      title="Not found — drwho.me"
      description="This page does not exist on drwho.me."
      path={path}
    >
      <header class="tool-head no-n">
        <div class="t">
          <h1>Not found</h1>
          <p>That page is not one of ours. Try the tools list instead.</p>
        </div>
      </header>
      <p>
        <a href="/tools">Back to all tools</a>
      </p>
    </Layout>
  );
}
