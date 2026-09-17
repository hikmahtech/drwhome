export default function HeadersProse() {
  return (
    <>
      <h2>What this does</h2>
      <p>
        Shows every header your browser sent with this request, sorted by name. Headers carry things
        like which languages you accept, whether the page came from cache, and cookies for this
        site.
      </p>
      <h2>What is left out</h2>
      <p>
        A few headers added by our hosting on the way in — Cloudflare and the reverse proxy in front
        of this server — are hidden. They describe our infrastructure, not your browser, and would
        only confuse the result.
      </p>
    </>
  );
}
