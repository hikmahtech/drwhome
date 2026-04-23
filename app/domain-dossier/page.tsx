import { DomainInput } from "@/app/domain-dossier/DomainInput";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { buildFaqJsonLd, buildSoftwareApplicationJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "domain health checker — dns, email, tls, headers — drwho.me",
  description:
    "run dns, mx, spf, dmarc, dkim, tls, redirects, headers, cors, and web-surface checks on any domain in one page. free, no sign-up.",
  path: "/domain-dossier",
  type: "page",
});

const checks = [
  {
    id: "dns",
    name: "dns",
    tool: "dns-records-lookup",
    body: "a, aaaa, ns, soa, caa, and txt records — everything a resolver asks the authoritative nameserver for.",
  },
  {
    id: "mx",
    name: "mx",
    tool: "mx-lookup",
    body: "the mail exchangers the domain advertises, sorted by priority. shows you which provider runs the inbox.",
  },
  {
    id: "spf",
    name: "spf",
    tool: "spf-checker",
    body: "the sender policy framework txt record that tells recipient mail servers which ips may send mail for this domain.",
  },
  {
    id: "dmarc",
    name: "dmarc",
    tool: "dmarc-checker",
    body: "the policy published at _dmarc.<domain> — p=none/quarantine/reject, alignment, and reporting addresses.",
  },
  {
    id: "dkim",
    name: "dkim",
    tool: "dkim-lookup",
    body: "probes the most common dkim selectors (default, google, k1, selector1/2, mxvault) to find the public key.",
  },
  {
    id: "tls",
    name: "tls",
    tool: "tls-certificate-checker",
    body: "subject, issuer, sans, fingerprint, and expiry for the certificate served over :443.",
  },
  {
    id: "redirects",
    name: "redirects",
    tool: "redirect-checker",
    body: "traces the http(s) redirect chain from https://<domain>/ up to ten hops.",
  },
  {
    id: "headers",
    name: "headers",
    tool: "security-headers-checker",
    body: "hsts, csp, x-frame-options, x-content-type-options, referrer-policy, permissions-policy — every header on /.",
  },
  {
    id: "cors",
    name: "cors",
    tool: "cors-checker",
    body: "runs a preflight options request and surfaces the access-control-* response headers.",
  },
  {
    id: "web surface",
    name: "web surface",
    tool: "web-surface-inspector",
    body: "fetches robots.txt, sitemap.xml, and the home page <head> to summarise the domain's public web surface.",
  },
];

const faq = [
  {
    q: "Is the dossier free?",
    a: "Yes. No sign-up, no rate limit signup, no ads. A soft rate limit of 30 requests per hour per ip is applied to keep the public infrastructure responsive.",
  },
  {
    q: "Does drwho.me store the domains I check?",
    a: "No. Results are cached per check so a second visitor doesn't re-run the same dns queries, but we don't tie the lookups to users or track who searched what.",
  },
  {
    q: "Can I use this in a ci pipeline?",
    a: "Use the MCP endpoint at /mcp for programmatic access. Each check is also available as a standalone page under /tools/.",
  },
  {
    q: "How fresh are the results?",
    a: "Each check has its own ttl (15 minutes for http probes, 1 hour for dns, 6 hours for tls certificates). Append ?refresh=1 to force a re-run.",
  },
];

export default function DomainDossier() {
  const url = siteUrl();
  const app = buildSoftwareApplicationJsonLd({
    name: "drwho.me domain dossier",
    description:
      "free web-based domain health checker — dns, email authentication (spf, dkim, dmarc), tls, redirects, headers, cors, and web-surface in one report.",
    path: "/domain-dossier",
    siteUrl: url,
  });
  const faqJson = buildFaqJsonLd(faq);

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/domain-dossier" />
      <TerminalPrompt>domain dossier</TerminalPrompt>

      <section className="space-y-3">
        <h2 className="text-lg">domain health checker</h2>
        <p className="text-sm text-muted">
          run ten independent checks on any domain — dns, email authentication, tls, redirects,
          headers, cors, and public-web surface — in one page.
        </p>
        <DomainInput />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm text-muted">what it checks</h2>
        {checks.map((c) => (
          <div key={c.id} className="space-y-1 border-t pt-3">
            <h3 className="text-sm">
              <Link href={`/tools/${c.tool}` as Route} className="text-accent">
                {c.name}
              </Link>
            </h3>
            <p className="text-sm text-muted">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">who uses it</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>devops preparing a domain transfer or dns migration</li>
          <li>email deliverability engineers auditing spf/dkim/dmarc alignment</li>
          <li>security teams reviewing http headers and tls configuration</li>
          <li>anyone pointing a new domain at production for the first time</li>
        </ul>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">read more</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <Link href={"/blog/what-is-dmarc" as Route}>what is dmarc?</Link>
          </li>
          <li>
            <Link href={"/blog/spf-10-lookup-limit" as Route}>the spf 10-lookup limit</Link>
          </li>
          <li>
            <Link href={"/blog/email-deliverability-checklist" as Route}>
              email deliverability checklist
            </Link>
          </li>
          <li>
            <Link href={"/blog/security-headers-guide" as Route}>
              security headers every site should have in 2026
            </Link>
          </li>
        </ul>
      </section>

      <JsonLd data={app} />
      <JsonLd data={faqJson} />
    </article>
  );
}
