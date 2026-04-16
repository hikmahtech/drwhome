import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>privacy</TerminalPrompt>
      <p className="text-muted">
        last updated: april 2026. drwho.me is operated by{" "}
        <a href="https://hikmahtechnologies.com" rel="noopener">
          hikmah technologies
        </a>
        . this policy supplements the parent{" "}
        <a href="https://hikmahtechnologies.com/privacy-policy/" rel="noopener">
          hikmah technologies privacy policy
        </a>
        ; where the two overlap the parent policy governs.
      </p>

      <h2 className="text-base mt-4">what we collect</h2>
      <p>
        drwho.me does not require accounts. we use Vercel Analytics, which is cookieless and
        collects aggregated page-view counts and Web Vitals only.
      </p>
      <p>
        tools that look up your IP read standard HTTP headers forwarded by our hosting provider and
        display them back to you. we do not store them. when you use the "ip lookup" tool we call
        ipinfo.io with the IP you submit; ipinfo.io's privacy practices apply to that request.
      </p>
      <p>
        the contact form sends the name, email, and message you provide to hikmah technologies via
        Resend. we retain contact messages only as long as needed to respond.
      </p>

      <h2 className="text-base mt-4">cookies</h2>
      <p>
        drwho.me itself does not set tracking cookies. google adsense (when enabled) uses cookies to
        serve ads; we default to non-personalized ads where available. you can disable cookies in
        your browser settings.
      </p>

      <h2 id="affiliates" className="text-base mt-4">
        affiliate links
      </h2>
      <p>
        some pages include affiliate links. when you click through and make a purchase we may
        receive a small commission, which keeps drwho.me free.
      </p>

      <h2 className="text-base mt-4">advertising</h2>
      <p>
        we display google adsense ads. adsense uses cookies to serve ads; we default to
        non-personalized ads where available.
      </p>

      <h2 className="text-base mt-4">your rights</h2>
      <p>
        under GDPR you may request access to, correction of, deletion of, restriction or objection
        to the processing of, or portability of your personal data. under CCPA you may request
        disclosure of data collected, deletion, and non-discrimination. email{" "}
        <a href="mailto:arshad@hikmahtechnologies.com">arshad@hikmahtechnologies.com</a> to exercise
        these rights.
      </p>

      <h2 className="text-base mt-4">children</h2>
      <p>
        drwho.me is not directed at children under 13 and we do not knowingly collect personal data
        from children under 13.
      </p>

      <h2 className="text-base mt-4">contact</h2>
      <p>
        privacy questions:{" "}
        <a href="mailto:arshad@hikmahtechnologies.com">arshad@hikmahtechnologies.com</a>. general
        questions: <a href="/contact">/contact</a>.
      </p>
    </article>
  );
}
