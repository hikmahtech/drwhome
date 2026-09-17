export default function WebSurfaceProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool fetches the domain's home page, <code>robots.txt</code> and{" "}
        <code>sitemap.xml</code>, and reads the page title, meta description, and the OpenGraph and
        Twitter card tags used when a link is shared.
      </p>
      <h2>What to look for</h2>
      <p>
        A missing title or description means search results and shared links fall back to whatever
        the platform guesses — usually the first line of text on the page. Missing OpenGraph tags
        mean a link shared on Slack, WhatsApp or social media shows no preview image or summary at
        all.
      </p>
      <h2>Not a security check</h2>
      <p>
        None of this is graded as a risk. A site can be perfectly secure with no sitemap and no
        social preview tags — these are discoverability signals, not vulnerabilities.
      </p>
    </>
  );
}
