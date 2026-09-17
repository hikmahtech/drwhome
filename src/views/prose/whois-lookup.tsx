export default function WhoisLookupProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool asks the domain's registry who the domain is registered with, and when it was
        created and when it expires. When a plain WHOIS query is refused or rate-limited, it falls
        back to RDAP, the newer HTTPS-based replacement — the "Source" row says which one answered.
      </p>
      <h2>What to look for</h2>
      <p>
        An expiry date under 30 days away is the one that matters: a domain that lapses stops
        resolving, and mail and web traffic go with it. Registrars usually offer auto-renewal — it's
        worth turning on well before that date, not after.
      </p>
    </>
  );
}
