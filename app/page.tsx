import { ToolCard } from "@/components/ToolCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { type Tool, type ToolCategory, tools } from "@/content/tools";
import { buildWebsiteJsonLd, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "drwho.me — network + dev tools",
  description: "Minimal, fast network and developer tools. No signup.",
  alternates: { canonical: "/" },
};

const categoryLabels: Record<ToolCategory, string> = {
  network: "network",
  dev: "dev utilities",
};

export default function Home() {
  const grouped = tools.reduce<Record<ToolCategory, Tool[]>>(
    (acc, t) => {
      acc[t.category].push(t);
      return acc;
    },
    { network: [], dev: [] },
  );

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl">
          <span className="text-accent">&gt;</span> drwho.me
          <span className="cursor" />
        </h1>
        <p className="text-sm text-muted mt-1">network + dev tools. minimal and fast.</p>
        <p className="text-xs text-muted">no signup. no tracking beyond ads.</p>
      </section>

      <section id="tools" className="space-y-6">
        {(Object.keys(grouped) as ToolCategory[])
          .filter((cat) => grouped[cat].length > 0)
          .map((cat) => (
            <div key={cat}>
              <h2 className="text-xs text-muted uppercase tracking-wide mb-2">
                {categoryLabels[cat]}
              </h2>
              <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 list-none p-0">
                {grouped[cat].map((t) => (
                  <li key={t.slug}>
                    <ToolCard tool={t} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>
      <JsonLd data={buildWebsiteJsonLd({ siteUrl: siteUrl() })} />
    </div>
  );
}
