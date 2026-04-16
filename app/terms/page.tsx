import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "terms", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>terms</TerminalPrompt>
      <p>
        drwho.me is provided as-is, without warranty. tools are best-effort and may be inaccurate or
        temporarily unavailable.
      </p>
      <p>
        by using drwho.me you agree not to abuse the service, attempt to overload it, or use it for
        unlawful purposes.
      </p>
      <p className="text-muted">
        these terms may change. questions: <a href="/contact">/contact</a>.
      </p>
    </article>
  );
}
