import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "about", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <article className="space-y-4">
      <TerminalPrompt>about</TerminalPrompt>
      <p>
        drwho.me is a small suite of network lookup and developer utility tools. built for speed,
        legibility, and respect for your time.
      </p>
      <p className="text-muted text-sm">
        run by hikmah technologies. contact at <a href="/contact">/contact</a>.
      </p>
    </article>
  );
}
