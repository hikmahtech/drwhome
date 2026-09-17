export default function MtaStsProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        MTA-STS (RFC 8461) lets a domain tell other mail servers "only deliver to me over TLS, and
        only to these servers." This tool reads the <code>_mta-sts</code> TXT record, then fetches
        the policy file it points to and reports its mode, allowed mail servers and cache lifetime.
      </p>
      <h2>What to look for</h2>
      <p>
        <code>enforce</code> means inbound mail must use TLS to one of the listed servers, or it
        gets rejected — no downgrade to plaintext or to a forged server. <code>testing</code> means
        the policy is being reported on but not yet enforced. <code>none</code> means a policy is
        published but has no real effect, which is a step people sometimes stop at by mistake, still
        exposed to the fallback to plaintext SMTP it's supposed to close.
      </p>
      <h2>No record at all</h2>
      <p>
        No <code>_mta-sts</code> TXT record just means MTA-STS isn't in use — most domains don't
        have one, and mail still works normally without it.
      </p>
    </>
  );
}
