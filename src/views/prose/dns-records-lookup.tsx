export default function DnsRecordsProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool resolves the six record types most people ask about in one pass: A and AAAA (the
        addresses), NS (who is authoritative for the domain), SOA (the zone's serial and timers),
        CAA (which certificate authorities may issue for it) and TXT (everything else, including SPF
        and domain verification strings).
      </p>
      <h2>What to look for</h2>
      <p>
        A record type with nothing shown here has no records of that type — not an error, an
        absence. NS records should match what the registrar has on file; a mismatch usually means a
        stale delegation.
      </p>
      <h2>For mail records specifically</h2>
      <p>
        MX, SPF, DMARC, DKIM and DNSSEC each have their own dedicated tool with the fuller detail
        those records need.
      </p>
    </>
  );
}
