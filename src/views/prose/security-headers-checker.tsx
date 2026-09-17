export default function SecurityHeadersProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool fetches the domain's home page over HTTPS and reads six response headers that
        browsers use to lock down a site: <code>Strict-Transport-Security</code>,{" "}
        <code>Content-Security-Policy</code>, <code>X-Frame-Options</code>,{" "}
        <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code> and{" "}
        <code>Permissions-Policy</code>. Every other header the server sends is listed too, under
        "Other headers".
      </p>
      <h2>What to look for</h2>
      <p>
        A header marked "not sent" is a gap, not necessarily a bug — plenty of sites run fine
        without all six. <code>Strict-Transport-Security</code> matters most: without it, a
        visitor's first request can still go out over plain HTTP before the redirect to HTTPS
        happens. Its <code>max-age</code> should be at least six months; a short one barely helps.
      </p>
      <h2>A missing header is not a missing site</h2>
      <p>
        This only reads what the server sent back. It does not try to break in, and a clean result
        here says nothing about the rest of the site's security.
      </p>
    </>
  );
}
