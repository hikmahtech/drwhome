export default function DnssecProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        DNSSEC signs DNS answers so a resolver can tell a real answer from a forged one. This tool
        looks up the domain's DS record (published at the registrar, pointing to the signing key)
        and its DNSKEY record (published in the domain's own DNS), then checks whether a resolver
        actually validated the chain between them.
      </p>
      <h2>What to look for</h2>
      <p>
        The AD flag is the part that matters: it is set by the resolver only when the signature
        chain checked out. A DS record with no AD flag means the chain is broken somewhere, which is
        worse than no DNSSEC at all — it can make the domain unreachable for resolvers that enforce
        validation.
      </p>
      <h2>Most domains have none of this</h2>
      <p>
        No DS and no DNSKEY simply means DNSSEC was never turned on, which is still the common case.
        It is not, by itself, a sign of a problem.
      </p>
    </>
  );
}
