import { Layout } from "../Layout";

export function About() {
  return (
    <Layout
      title="About — drwho.me"
      description="Who runs drwho.me, why the tools are free, what runs in your browser versus on the server, and how to reach us."
      path="/about"
    >
      <header class="tool-head no-n">
        <div class="t">
          <span class="label">Who runs this</span>
          <h1>About drwho.me</h1>
          <p>drwho.me is built and run by Hikmah Technologies, the team behind Domain Posture.</p>
        </div>
      </header>
      <div class="bench">
        <aside class="side">
          <span class="label">Contact</span>
          <ul>
            <li>
              <a href="mailto:arshad@hikmahtechnologies.com">arshad@hikmahtechnologies.com</a>
            </li>
          </ul>
          <span class="label">Code</span>
          <ul>
            <li>
              <a href="https://github.com/hikmahtech/drwhome" rel="noopener">
                github.com/hikmahtech/drwhome
              </a>
            </li>
          </ul>
        </aside>
        <div class="main">
          <div class="prose">
            <h2>Why the tools are free</h2>
            <p>
              drwho.me is the free front door to <a href="/go/report?from=about">Domain Posture</a>,
              our paid product. Domain Posture runs all 18 checks on a domain at once, grades them,
              and sells scheduled monitoring and signed evidence packs. The single checks here cost
              us little to run and give people a reason to try the full report.
            </p>
            <h2>What runs where</h2>
            <p>
              Tools marked "runs in your browser" call a public service, such as Cloudflare DNS or
              crt.sh, straight from your browser. The domain you type never reaches our server.
              Tools marked "runs on our server" send the domain to us so we can fetch what your
              browser cannot, such as another site's response headers; we do not store it. See{" "}
              <a href="/privacy">the privacy page</a> for the full list.
            </p>
            <h2>Open source</h2>
            <p>
              The code for drwho.me is open source, under the MIT licence, at{" "}
              <a href="https://github.com/hikmahtech/drwhome" rel="noopener">
                github.com/hikmahtech/drwhome
              </a>
              .
            </p>
            <h2>Contact</h2>
            <p>
              Questions, bug reports or anything else:{" "}
              <a href="mailto:arshad@hikmahtechnologies.com">arshad@hikmahtechnologies.com</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
