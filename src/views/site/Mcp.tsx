import { Layout } from "../Layout";

export type McpTool = { name: string; description: string; slug?: string };

const CONFIG_BLOCK = `{
  "mcpServers": {
    "drwho": { "url": "https://drwho.me/mcp/mcp" }
  }
}`;

/** The tool table shows only the first sentence, so the page stays scannable. */
function firstSentence(s: string): string {
  const i = s.indexOf(". ");
  return i === -1 ? s : `${s.slice(0, i)}.`;
}

export function Mcp({ mcpTools }: { mcpTools: McpTool[] | null }) {
  return (
    <Layout
      title="MCP server — drwho.me"
      description="Call drwho.me's free tools from an AI agent over MCP: one endpoint, no key, no account."
      path="/mcp"
    >
      <header class="tool-head">
        <div class="n" aria-hidden="true">
          60
        </div>
        <div class="t">
          <span class="label">Free MCP server, no key, no account</span>
          <h1>Use these tools from an AI agent</h1>
          <p>
            Every tool on drwho.me is also callable over the Model Context Protocol, so an agent can
            run the same checks a person runs by hand.
          </p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          <span class="label">For people</span>
          <ul>
            <li>
              <a href="/tools">Use the tools in a browser</a>
            </li>
          </ul>
          <span class="label">Fair use</span>
          <ul>
            <li>60 tool calls an hour, per address. No key needed below that.</li>
          </ul>
        </aside>
        <div class="main">
          <dl class="rows first">
            <div class="row">
              <dt>Endpoint</dt>
              <dd>
                <div class="v">https://drwho.me/mcp/mcp</div>
              </dd>
            </div>
            <div class="row">
              <dt>Transport</dt>
              <dd>
                <div class="v sans">Streamable HTTP</div>
              </dd>
            </div>
            <div class="row">
              <dt>Auth</dt>
              <dd>
                <div class="v sans">None</div>
              </dd>
            </div>
            <div class="row">
              <dt>Rate limit</dt>
              <dd>
                <div class="v sans">60 tool calls an hour, per address</div>
              </dd>
            </div>
          </dl>

          <span class="label out-label">Claude Code</span>
          <pre class="code">
            <code>claude mcp add --transport http drwho https://drwho.me/mcp/mcp</code>
          </pre>

          <span class="label out-label">Claude Desktop, Cursor, VS Code and similar</span>
          <p class="hint">
            Most clients take a config block shaped like this. Check your client's own docs for
            exactly where it goes.
          </p>
          <pre class="code">
            <code>{CONFIG_BLOCK}</code>
          </pre>

          <span class="label out-label">Tools</span>
          {mcpTools ? (
            <dl class="rows">
              {mcpTools.map((t) => (
                <div class="row">
                  <dt>{t.name}</dt>
                  <dd>
                    <div class="v sans">{firstSentence(t.description)}</div>
                    {t.slug ? (
                      <div class="note">
                        <a href={`/tools/${t.slug}`}>Also a page on drwho.me</a>
                      </div>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p class="hint">The tool list will appear here.</p>
          )}

          <div class="prose">
            <h2>How this differs from Domain Posture's MCP</h2>
            <p>
              This server answers one check at a time, free, with no key. Domain Posture's MCP
              server runs the full graded audit across all 18 checks and can set up scheduled
              monitoring — that stays a paid call.
            </p>
          </div>
          <aside class="more">
            <div>
              <h2>Want the graded audit from an agent too?</h2>
              <p>This link leaves drwho.me and opens domainposture.com.</p>
            </div>
            <a href="/go/mcp?from=mcp" rel="noopener">
              Continue to domainposture.com
            </a>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
