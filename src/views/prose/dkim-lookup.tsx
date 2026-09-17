export default function DkimProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        DKIM signs outgoing mail with a private key, and publishes the matching public key as a DNS
        TXT record under a selector, like <code>google._domainkey.&lt;domain&gt;</code>. This tool
        probes 22 selector names used by common mail providers and reports the ones that answer.
      </p>
      <h2>What to look for</h2>
      <p>
        One matching selector is enough — most domains send through a single provider. A domain can
        be genuinely signing mail and still show nothing here if it uses a selector outside this
        list.
      </p>
      <h2>A limit worth knowing</h2>
      <p>
        Amazon SES signs with a random, per-identity selector that cannot be guessed. A domain
        sending through SES will often read as "no DKIM" here even though DKIM is switched on.
      </p>
    </>
  );
}
