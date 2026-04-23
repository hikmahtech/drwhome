import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { tools } from "@/content/tools";
import { pageMetadata } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "developer + network tools — drwho.me",
  description:
    "free developer and network tools: dns lookup, dmarc checker, spf checker, jwt decoder, base64, url codec, json formatter, and the domain dossier. no ads, no tracking.",
  path: "/tools",
  type: "page",
});

export default function ToolsHub() {
  const network = tools.filter((t) => t.category === "network");
  const dev = tools.filter((t) => t.category === "dev");

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/tools" />
      <TerminalPrompt>tools</TerminalPrompt>

      <section className="space-y-3 border p-4">
        <h2 className="text-sm text-muted">featured</h2>
        <p className="text-sm">
          <Link href={"/domain-dossier" as Route} className="underline">
            domain dossier
          </Link>{" "}
          — run ten checks on any domain in one go: dns, mx, spf, dmarc, dkim, tls, redirects,
          headers, cors, and web surface. one page, one shareable link.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-muted">network</h2>
        <ul className="space-y-2 list-none p-0">
          {network.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}` as Route} className="text-sm">
                <span className="text-accent">{t.name}</span>{" "}
                <span className="text-muted">— {t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-muted">dev</h2>
        <ul className="space-y-2 list-none p-0">
          {dev.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}` as Route} className="text-sm">
                <span className="text-accent">{t.name}</span>{" "}
                <span className="text-muted">— {t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
