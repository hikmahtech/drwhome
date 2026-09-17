export default function CorsCheckerProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool sends a CORS preflight request — an <code>OPTIONS</code> request with an{" "}
        <code>Origin</code> header — to the domain's home page, and reads back whichever{" "}
        <code>Access-Control-*</code> response headers it sends. These headers are what let a page
        on one site read data from another.
      </p>
      <h2>What to look for</h2>
      <p>
        No <code>Access-Control-Allow-Origin</code> header means cross-origin reads are blocked by
        default, which is the safe starting point for anything that isn't meant to be a public API.{" "}
        <code>Access-Control-Allow-Origin: *</code> means any site can read the response — fine for
        public data, worth a second look for anything else.
      </p>
      <h2>The wildcard-plus-credentials case</h2>
      <p>
        <code>Allow-Origin: *</code> together with <code>Allow-Credentials: true</code> is a
        contradiction the CORS spec forbids: browsers refuse it and block the request, so nothing
        actually leaks. Seeing it still means the server's CORS policy was built incorrectly and
        should name real origins instead of a wildcard.
      </p>
    </>
  );
}
