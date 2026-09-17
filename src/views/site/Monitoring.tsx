import { Layout } from "../Layout";

const COVERS: [string, string][] = [
  ["Scheduled re-checks", "The same checks run again on a schedule, without you asking."],
  [
    "Change alerts",
    "An alert when a result changes, such as a certificate near expiry or a new mail server.",
  ],
  [
    "Evidence packs",
    "A signed, dated record of a domain's checks, made to attach to a vendor security questionnaire.",
  ],
];

/**
 * Content page for the paid side of monitoring, mirroring DomainReport.tsx: header, bench,
 * more band. Domain Posture owns the product and the pricing; this page only explains what it is.
 */
export function Monitoring() {
  return (
    <Layout
      title="Scheduled monitoring — drwho.me"
      description="What scheduled monitoring, change alerts and signed evidence packs are, and who on domainposture.com they are for."
      path="/monitoring"
    >
      <header class="tool-head no-n">
        <div class="t">
          <span class="label">Paid, on our sister site, domainposture.com</span>
          <h1>Scheduled monitoring and evidence packs</h1>
          <p>
            The checks on drwho.me are a single look, right now. Domain Posture can run them again
            on its own, watch for change, and hand you a signed record when someone asks for proof.
          </p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          <span class="label">Who it is for</span>
          <ul>
            <li>People who answer vendor security questionnaires and need current proof.</li>
            <li>Agencies looking after domains for more than one client.</li>
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
              <h2>See monitoring on domainposture.com.</h2>
              <p>This link leaves drwho.me and opens domainposture.com.</p>
            </div>
            <a href="/go/monitoring?from=monitoring" rel="noopener">
              Continue to domainposture.com
            </a>
          </aside>
          <div class="prose">
            <h2>What stays here</h2>
            <p>
              Every single check on drwho.me stays free, with no account, whether or not you use
              monitoring. Monitoring is a domainposture.com product, not something drwho.me sells.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
