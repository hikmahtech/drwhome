import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "about", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>about</TerminalPrompt>
      <p>
        drwho.me is a small suite of developer and network utilities — base64, jwt, dns, uuid, url,
        json, user-agent, ip lookup — available as a web app and a remote mcp endpoint. built for
        speed, legibility, and respect for your time.
      </p>
      <p>
        the site exists because the usual options for online dev tools are slow, ad-heavy, and
        can&apos;t be called from an ai client. drwho.me is the opposite: no signup, no trackers, no
        popups, every tool is open, and every tool is callable from claude desktop, cursor,
        windsurf, or any mcp-capable client via <a href="/mcp">drwho.me/mcp</a>.
      </p>
      <p>
        maintained by <strong>arshad ansari</strong>, a data engineer working on data infrastructure
        for financial services. the site is built with next.js 15 and deployed on vercel; source at{" "}
        <a
          href="https://github.com/hikmahtech/drwhome"
          rel="noopener"
          className="text-accent break-all"
        >
          github.com/hikmahtech/drwhome
        </a>
        .
      </p>
      <p>
        run under{" "}
        <a href="https://hikmahtechnologies.com" rel="noopener" className="text-accent">
          hikmah technologies
        </a>{" "}
        — a data engineering consultancy for financial services.
      </p>
      <p className="text-muted">
        questions: <a href="/contact">/contact</a>. privacy: <a href="/privacy">/privacy</a>.
      </p>
    </article>
  );
}
