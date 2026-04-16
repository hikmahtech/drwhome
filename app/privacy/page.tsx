import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <article className="space-y-4 text-sm">
      <TerminalPrompt>privacy</TerminalPrompt>
      <h2 className="text-base mt-4">what we collect</h2>
      <p>
        drwho.me does not require accounts. we use Vercel Analytics, which is cookieless and
        collects aggregated page-view counts and Web Vitals only.
      </p>
      <p>
        tools that look up your IP read standard HTTP headers forwarded by our hosting provider and
        display them back to you. we do not store them.
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
      <h2 className="text-base mt-4">contact</h2>
      <p>
        questions: <a href="/contact">/contact</a>.
      </p>
    </article>
  );
}
