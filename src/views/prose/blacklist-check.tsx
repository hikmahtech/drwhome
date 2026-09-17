export default function BlacklistProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool finds the domain's website address and mail server addresses, then checks each one
        against six DNS blocklists (DNSBLs) that mail and network filters use to flag known sources
        of spam or abuse.
      </p>
      <h2>What to look for</h2>
      <p>
        A listing on even one blocklist can get mail from this domain sent straight to spam, or
        rejected outright, by receivers that use it. If an address is listed, the block's own site
        (linked from each result) explains how the listing happened and how to ask for removal.
      </p>
      <h2>Why Spamhaus is not here</h2>
      <p>
        Spamhaus, the best-known blocklist, refuses lookups from public DNS resolvers like the one
        this tool uses, and answers them with a sentinel code instead of a real result. Rather than
        misreport that as "clean", this tool leaves Spamhaus out and only queries lists confirmed to
        answer correctly this way.
      </p>
    </>
  );
}
