export default function SecurityTxtProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        RFC 9116 defines <code>/.well-known/security.txt</code>: a plain-text file that tells a
        security researcher who finds a bug on your site how to report it. This tool fetches it and
        requires at least one <code>Contact:</code> line before counting it as real — a catch-all
        page that answers 200 for any path doesn't qualify.
      </p>
      <h2>What to look for</h2>
      <p>
        No file means no published way to report a vulnerability responsibly, so a researcher who
        finds one has to guess an email address or post about it publicly instead. An{" "}
        <code>Expires</code> date past today means the file is stale and should be refreshed even if
        the contact details still work.
      </p>
    </>
  );
}
