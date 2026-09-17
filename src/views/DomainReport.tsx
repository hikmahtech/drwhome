import { Layout } from "./Layout";

const COVERS: [string, string][] = [
  [
    "Email",
    "SPF, DKIM, DMARC, MTA-STS and TLS reporting, read together as one picture of who can send as you.",
  ],
  ["DNS", "Records, mail servers and DNSSEC."],
  ["Web", "TLS certificate, security headers, redirects, CORS and what the site exposes."],
  ["Discovery", "WHOIS and the subdomains that certificate logs reveal."],
  ["AI readiness", "What robots.txt tells AI crawlers, llms.txt and security.txt."],
];

/**
 * The step between a drwho.me result and domainposture.com. People should know they are about
 * to leave this site, and why, before they do. The button names where it goes.
 */
export function DomainReport({ domain, from }: { domain?: string; from?: string }) {
  const go = `/go/report?${new URLSearchParams({ ...(domain ? { domain } : {}), from: from ?? "domain-report" })}`;
  return (
    <Layout
      title="The full domain report — drwho.me"
      description="What the full 18-check domain report on Domain Posture covers, and how it differs from the single checks on drwho.me."
      path="/domain-report"
    >
      <header class="tool-head">
        <div class="n" aria-hidden="true">
          18
        </div>
        <div class="t">
          <span class="label">On our sister site, domainposture.com</span>
          <h1>The full domain report</h1>
          <p>
            Each tool on drwho.me checks one thing. Domain Posture runs all 18 checks on a domain at
            once, grades every result, and tells you what to fix first. The report is free.
          </p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          <span class="label">Same team</span>
          <ul>
            <li>
              drwho.me and domainposture.com are built by the same people, on the same checks.
            </li>
          </ul>
        </aside>
        <div class="main">
          <dl class="rows first">
            {COVERS.map(([label, value]) => (
              <div class="row">
                <dt>{label}</dt>
                <dd>
                  <div class="v sans">{value}</div>
                </dd>
              </div>
            ))}
          </dl>
          <aside class="more">
            <div>
              <h2>
                {domain ? `See the report for ${domain}.` : "See the report for your domain."}
              </h2>
              <p>This link leaves drwho.me and opens domainposture.com.</p>
            </div>
            <a href={go} rel="noopener">
              Continue to domainposture.com
            </a>
          </aside>
          <div class="prose">
            <h2>What you get there that you do not get here</h2>
            <p>
              A grade for every check, a list of fixes in order of importance, and one page you can
              share. Paid plans add scheduled re-checks, alerts when something changes, and signed
              evidence packs for security questionnaires.
            </p>
            <h2>What stays here</h2>
            <p>
              Every single check on drwho.me stays free, with no account. Use them as often as you
              like.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
