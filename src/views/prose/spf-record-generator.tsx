export default function SpfGeneratorProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Builds an SPF TXT record from the servers that send mail for your domain, and counts the DNS
        lookups it will cost.
      </p>
      <h2>The 10-lookup limit</h2>
      <p>
        SPF allows at most 10 DNS lookups when a receiving server checks your record —{" "}
        <code>a</code>, <code>mx</code> and each <code>include:</code> count as one each. Go over 10
        and SPF returns PermError, which most receivers treat as a fail, for mail that would
        otherwise have passed.
      </p>
      <h2>Choosing the all mechanism</h2>
      <p>
        <code>-all</code> tells receivers to reject anything not listed. <code>~all</code> asks them
        to mark it suspicious instead. <code>+all</code> authorizes every server on the internet to
        send as your domain, which defeats the point of SPF — this tool warns if you pick it.
      </p>
    </>
  );
}
