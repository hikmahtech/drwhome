import { McpInstallButton } from "@/components/mcp/McpInstallButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { findTool } from "@/content/tools";
import { mcpTools } from "@/lib/mcp/tools";
import type { Route } from "next";
import Link from "next/link";

type Props = {
  client: string;
  configPath: string;
  config: string;
  footnote?: string;
};

export function McpConfigBlock({ client, configPath, config, footnote }: Props) {
  return (
    <>
      <section className="space-y-2">
        <h2 className="text-sm text-muted">config</h2>
        <TerminalCard label={configPath}>
          <pre className="text-xs whitespace-pre overflow-x-auto">{config}</pre>
        </TerminalCard>
        <div className="flex items-center gap-3">
          <McpInstallButton client={client} config={config} />
          {footnote && <p className="text-xs text-muted">{footnote}</p>}
        </div>
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
    </>
  );
}
