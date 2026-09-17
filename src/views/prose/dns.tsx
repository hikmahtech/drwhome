export default function DnsProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Resolves one DNS record type for a name, straight from your browser to Cloudflare's public
        resolver (1.1.1.1) over DNS-over-HTTPS. The name you enter goes to Cloudflare to run the
        lookup — nowhere else.
      </p>
      <h2>No records vs. no domain</h2>
      <p>
        A domain can exist but have no record of the type you asked for — for example, a domain with
        no <code>MX</code> records still exists. That is different from the domain not existing at
        all (NXDOMAIN). This tool tells the two apart instead of showing "not found" for both.
      </p>
      <h2>TTL</h2>
      <p>
        Each answer's TTL is how many seconds a resolver is allowed to cache it before asking again.
        A short TTL means changes propagate fast; a long one means they take longer to show up
        everywhere.
      </p>
    </>
  );
}
