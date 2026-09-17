export default function CtLogProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        Every public TLS certificate gets logged in certificate transparency logs, permanently and
        publicly, as part of how browsers trust it. This tool searches those logs for certificates
        naming this domain and lists the subdomains they cover.
      </p>
      <h2>What to look for</h2>
      <p>
        This finds real subdomains even when they are not linked from anywhere and were never meant
        to be public — a staging server, an old marketing microsite, an internal tool with a
        certificate. The list is capped at 100 names; a domain that hits the cap has more than are
        shown.
      </p>
      <h2>A wildcard certificate hides its names</h2>
      <p>
        A certificate for <code>*.example.com</code> covers every subdomain at once without naming
        any of them, so it shows up here as a wildcard rather than adding to the list.
      </p>
    </>
  );
}
