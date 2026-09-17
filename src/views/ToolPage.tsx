import type { Context } from "hono";
import { isReady } from "../content/ready";
import { type Tool, toolNumber, tools } from "../content/tools";
import type { Report } from "../reports/report";
import { Layout } from "./Layout";
import { MoreBand, ReportView } from "./ReportView";
import { forms, pages, prose } from "./load";

type Props = { tool: Tool; c: Context; domain?: string; report?: Report };

const RUNS_LABEL = { browser: "Runs in your browser", server: "Runs on our server" };

function CheckBody({ tool, domain, report }: Props) {
  return (
    // dw-check is upgraded by /js/check.js. The URL holds the state.
    <dw-check tool={tool.slug}>
      <form class="ask" method="get" action={`/tools/${tool.slug}`}>
        <input
          name="domain"
          type="text"
          inputmode="url"
          autocomplete="off"
          autocapitalize="none"
          spellcheck={false}
          placeholder="example.com"
          aria-label="Domain"
          value={domain ?? ""}
          required
        />
        {/* Without JavaScript a server check still works: this asks the server to render it. */}
        {tool.runs === "server" ? (
          <noscript>
            <input type="hidden" name="ssr" value="1" />
          </noscript>
        ) : null}
        <button type="submit">Check</button>
      </form>
      <p class="hint">
        {tool.runs === "browser"
          ? "The lookup goes from your browser straight to a public service. We never see the domain."
          : "The check runs on our server. We do not store the domain."}
      </p>
      {tool.runs === "browser" ? (
        <noscript>
          <p class="hint">This tool runs in your browser, so it needs JavaScript.</p>
        </noscript>
      ) : null}
      <div class="report" data-report aria-live="polite">
        {report && domain ? (
          <>
            <ReportView report={report} />
            <MoreBand domain={domain} from={tool.slug} />
          </>
        ) : null}
      </div>
    </dw-check>
  );
}

export function ToolPage(props: Props) {
  const { tool, c } = props;
  const related = tools.filter((x) => x.group === tool.group && x.slug !== tool.slug && isReady(x));
  const Prose = prose.get(tool.slug);
  const Form = forms.get(tool.slug);
  const Page = pages.get(tool.slug);
  const script = tool.kind === "check" ? "check" : tool.kind === "live" ? tool.slug : undefined;

  return (
    <Layout
      title={`${tool.name} — drwho.me`}
      description={tool.summary}
      path={`/tools/${tool.slug}`}
      script={script}
    >
      <header class="tool-head">
        <div class="n" aria-hidden="true">
          {toolNumber(tool.slug)}
        </div>
        <div class="t">
          <span class="label">{RUNS_LABEL[tool.runs]}</span>
          <h1>{tool.name}</h1>
          <p>{tool.summary}</p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          {related.length > 0 ? (
            <>
              <span class="label">Related</span>
              <ul>
                {related.map((x) => (
                  <li>
                    <a href={`/tools/${x.slug}`}>{x.name}</a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <span class="label">For AI agents</span>
          <ul>
            <li>
              <a href="/mcp">Use these tools over MCP</a>
            </li>
          </ul>
        </aside>
        <div class="main">
          {tool.kind === "check" ? <CheckBody {...props} /> : null}
          {tool.kind === "live" && Form ? <Form /> : null}
          {tool.kind === "page" && Page ? <Page c={c} /> : null}
          {Prose ? (
            <div class="prose">
              <Prose />
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
