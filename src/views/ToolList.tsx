import { isReady } from "../content/ready";
import { GROUPS, type Tool, toolNumber, tools } from "../content/tools";

function Entry({ tool }: { tool: Tool }) {
  const inner = (
    <>
      <span class="n">{toolNumber(tool.slug)}</span>
      <span class="name">{tool.name}</span>
      <span class="sum">{tool.summary}</span>
      <span class="runs">{tool.runs === "browser" ? "In your browser" : "On our server"}</span>
    </>
  );
  return isReady(tool) ? (
    <a class="entry" href={`/tools/${tool.slug}`}>
      {inner}
    </a>
  ) : (
    <div class="entry soon">{inner}</div>
  );
}

/** The grouped, numbered tool list. Shared by the home page and /tools, so there is one copy. */
export function ToolList() {
  return (
    <>
      {GROUPS.map((g) => (
        <section class="group" aria-labelledby={`g-${g.id}`}>
          <h2 id={`g-${g.id}`}>{g.title}</h2>
          <ol>
            {tools
              .filter((x) => x.group === g.id)
              .map((x) => (
                <li>
                  <Entry tool={x} />
                </li>
              ))}
          </ol>
        </section>
      ))}
    </>
  );
}
