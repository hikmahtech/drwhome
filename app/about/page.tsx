import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "about", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>about</TerminalPrompt>
      <p>
        drwho.me is a small suite of network lookup and developer utility tools. built for speed,
        legibility, and respect for your time.
      </p>
      <p>
        run by{" "}
        <a href="https://hikmahtechnologies.com" rel="noopener">
          hikmah technologies
        </a>{" "}
        — a data engineering consultancy for financial services.
      </p>
      <p className="text-muted">
        questions: <a href="/contact">/contact</a>.
      </p>
    </article>
  );
}
