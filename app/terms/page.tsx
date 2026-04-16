import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "terms", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>terms</TerminalPrompt>
      <p className="text-muted">
        last updated: april 2026. drwho.me is operated by{" "}
        <a href="https://hikmahtechnologies.com" rel="noopener">
          hikmah technologies
        </a>
        . these terms supplement the parent{" "}
        <a href="https://hikmahtechnologies.com/terms-and-conditions/" rel="noopener">
          hikmah technologies terms and conditions
        </a>
        .
      </p>

      <h2 className="text-base mt-4">service</h2>
      <p>
        drwho.me is provided as-is, without warranty. tools are best-effort and may be inaccurate,
        rate-limited, or temporarily unavailable.
      </p>

      <h2 className="text-base mt-4">acceptable use</h2>
      <p>
        by using drwho.me you agree not to misuse the service — no automated scraping that overloads
        our infrastructure, no attempts at unauthorized access, no distribution of harmful software,
        and no use for unlawful purposes.
      </p>

      <h2 className="text-base mt-4">intellectual property</h2>
      <p>
        site code, design, and branding are the intellectual property of hikmah technologies. tool
        outputs computed from your inputs belong to you.
      </p>

      <h2 className="text-base mt-4">limitation of liability</h2>
      <p>
        hikmah technologies is not liable for any indirect, incidental, or consequential damages
        arising from your use of drwho.me.
      </p>

      <h2 className="text-base mt-4">eligibility</h2>
      <p>
        you must be at least 18 years old or have legal capacity to contract in your jurisdiction to
        use drwho.me.
      </p>

      <h2 className="text-base mt-4">termination</h2>
      <p>
        we may suspend or terminate access for any violation of these terms or the parent policy.
      </p>

      <h2 className="text-base mt-4">changes</h2>
      <p>these terms may change. continued use after an update constitutes acceptance.</p>

      <h2 className="text-base mt-4">contact</h2>
      <p>
        questions: <a href="/contact">/contact</a> or{" "}
        <a href="mailto:support@hikmahtechnologies.com">support@hikmahtechnologies.com</a>.
      </p>
    </article>
  );
}
