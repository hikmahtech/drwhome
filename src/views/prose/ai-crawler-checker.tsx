export default function AiCrawlerProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        This tool reads <code>robots.txt</code> and looks for rules addressed to six named AI
        crawlers: GPTBot (OpenAI), ClaudeBot (Anthropic), Google-Extended, PerplexityBot, CCBot
        (Common Crawl) and meta-externalagent (Meta). Each one is reported allowed, blocked, or
        unspecified.
      </p>
      <h2>What to look for</h2>
      <p>
        "Unspecified" means that crawler has no rule of its own — it falls through to whatever{" "}
        <code>User-agent: *</code> says, which is a site-wide stance, not an AI-specific one. To opt
        a crawler out of training your content or answering questions from it, robots.txt needs a
        rule naming it directly, for example <code>User-agent: GPTBot</code> followed by{" "}
        <code>Disallow: /</code>.
      </p>
      <h2>A stance, not a score</h2>
      <p>
        Blocking these crawlers is a business decision, not a vulnerability, and this tool never
        marks either choice as good or bad.
      </p>
    </>
  );
}
