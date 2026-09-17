import { Layout } from "../Layout";

export function Privacy() {
  return (
    <Layout
      title="Privacy — drwho.me"
      description="What drwho.me sends where, for each kind of tool, and what it does not keep."
      path="/privacy"
    >
      <header class="tool-head no-n">
        <div class="t">
          <span class="label">Short and specific</span>
          <h1>Privacy</h1>
          <p>What actually happens when you use a tool on drwho.me, tool by tool.</p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          <span class="label">In short</span>
          <ul>
            <li>No accounts.</li>
            <li>No stored history of what you looked up.</li>
            <li>Text you type into a developer tool never leaves the page.</li>
          </ul>
        </aside>
        <div class="main">
          <div class="prose">
            <h2>Tools that run in your browser</h2>
            <p>
              A tool marked "runs in your browser" sends the lookup from your browser straight to a
              public service: Cloudflare DNS over HTTPS at cloudflare-dns.com for DNS records, or
              crt.sh for certificate logs. The domain you look up never reaches drwho.me.
            </p>
            <h2>Tools that run on our server</h2>
            <p>
              A tool marked "runs on our server" sends the domain to the drwho.me server, which runs
              the check and returns the result. The server does not store the domain.
            </p>
            <h2>What is my IP, and IP lookup</h2>
            <p>
              These two send an IP address to ipinfo.io to get its location and network. For "What
              is my IP" that address is yours; for "IP lookup" it is whichever address you typed in.
            </p>
            <h2>Developer tools</h2>
            <p>
              Base64, the JWT decoder, the JSON formatter, the URL encoder and the UUID generator
              all run entirely in the page. Whatever you type into them never leaves your browser.
            </p>
            <h2>Rate limiting</h2>
            <p>
              The server keeps a short-lived, in-memory count of requests per visitor address, used
              only to stop one address from making too many checks in an hour. Nothing else is built
              from it, and it is not kept.
            </p>
            <h2>Accounts</h2>
            <p>drwho.me has no accounts, no sign-up and no login.</p>
            <h2>Analytics</h2>
            <p>
              The site uses Google Analytics (GA4) to count page views and events. For visitors in
              the EEA, the UK and Switzerland, this is off until you agree to it. Links from
              drwho.me to Domain Posture carry UTM tags so we can see which tool sent the click. We
              send which tool ran and whether it found a problem, never the domain, address or text
              you entered.
            </p>
            <p>
              Cloudflare also adds its Web Analytics script to the pages. It counts visits and page
              speed without cookies and does not follow you across sites.
            </p>
            <h2>Hosting</h2>
            <p>drwho.me sits behind Cloudflare, which fronts and caches the site.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
