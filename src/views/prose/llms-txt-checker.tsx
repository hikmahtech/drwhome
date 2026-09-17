export default function LlmsTxtProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        <code>llms.txt</code> is a proposed convention for pointing AI agents at a plain-text
        summary of a site, instead of leaving them to scrape the rendered page. This tool fetches{" "}
        <code>/llms.txt</code> at the domain root and confirms it's real markdown — a Heading 1 as
        the first line, not a catch-all page that happens to answer 200 for any path.
      </p>
      <h2>What to look for</h2>
      <p>
        Not having one is normal; it's a new, optional convention, and most sites don't publish it
        yet. If you do publish one, the title shown here is that first heading — it's what an agent
        reading the file sees as the page's subject.
      </p>
    </>
  );
}
