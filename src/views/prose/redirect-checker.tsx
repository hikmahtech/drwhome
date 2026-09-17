export default function RedirectCheckerProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool requests <code>https://domain/</code> and follows every redirect, up to 10 hops,
        listing the status code and URL at each step.
      </p>
      <h2>What to look for</h2>
      <p>
        A long chain adds latency to every visit and can hit a browser's own redirect limit —
        collapse it to a single redirect where you can. A chain that ends up on a different domain
        is worth a second look: confirm it's a move or a CDN you expect, not a misconfiguration
        sending your traffic somewhere else. A final hop that is plain HTTP, not HTTPS, means the
        connection was never encrypted end to end.
      </p>
    </>
  );
}
