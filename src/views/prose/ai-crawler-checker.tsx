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
      <h2>Blocking one crawler, allowing another</h2>
      <p>
        Each AI crawler is a separate <code>User-agent</code>, so a robots.txt file can treat them
        differently. A site that wants its pages in ChatGPT's answers but not in Common Crawl's open
        dataset can say so explicitly:
      </p>
      <pre class="code">
        <code>
          {`User-agent: GPTBot
Disallow:

User-agent: CCBot
Disallow: /`}
        </code>
      </pre>
      <p>
        The empty <code>Disallow:</code> means "nothing is disallowed" — GPTBot may crawl
        everything. Because a group with no matching rule falls through to{" "}
        <code>User-agent: *</code>, an empty disallow is how you name a crawler to opt it in when
        the wildcard group blocks everything.
      </p>
      <h2>How the wildcard interacts with named groups</h2>
      <p>
        A crawler reads robots.txt by picking the most specific group that matches its own name; a
        crawler with no group of its own uses <code>User-agent: *</code> instead. Groups are not
        merged: if <code>User-agent: ClaudeBot</code> appears, ClaudeBot ignores the wildcard group
        entirely, even if its own group has no rules in it. So a file like this lets every ordinary
        crawler in while shutting out Google's AI training crawler and Meta's:
      </p>
      <pre class="code">
        <code>
          {`User-agent: *
Allow: /

User-agent: Google-Extended
Disallow: /

User-agent: meta-externalagent
Disallow: /`}
        </code>
      </pre>
      <p>
        Google-Extended is the token Google recognizes for Gemini training; Google's ordinary search
        crawler, Googlebot, is unaffected by it. PerplexityBot is Perplexity's crawler for its
        answer engine. Both obey the same group-matching rules as any other bot.
      </p>
      <h2>What robots.txt does not do</h2>
      <p>
        robots.txt is a request, enforced only by crawlers that choose to honour it. It does not
        stop scraping, paywall circumvention or a bot that ignores the file, and it is public —
        anyone can read it to see which AI companies a site has decided to work with. Content that
        must never be fetched belongs behind authentication, not behind a disallow line.
      </p>
      <h2>A stance, not a score</h2>
      <p>
        Blocking these crawlers is a business decision, not a vulnerability, and this tool never
        marks either choice as good or bad. Opting out can keep content exclusive and reduce
        crawling load; opting in can put your pages in AI answers that people read instead of search
        results. The right answer depends on the site, and this page takes no side.
      </p>
      <h2>FAQ</h2>
      <h3>Does blocking GPTBot remove my site from ChatGPT?</h3>
      <p>
        It stops GPTBot from crawling from that point on. Content already collected may still appear
        for a while, and links ChatGPT learns about elsewhere can still be surfaced without a fresh
        crawl.
      </p>
      <h3>Which group wins if two rules match?</h3>
      <p>
        Only one group applies per crawler: the one whose <code>User-agent</code> most closely
        matches its name. Matching is case-insensitive substring-based, but the well-known tokens
        above are exact names. Within a group, the longest matching <code>Disallow</code> or{" "}
        <code>Allow</code> path wins.
      </p>
      <h3>Do I need a separate group for every AI crawler?</h3>
      <p>
        Only for the ones you want to treat differently from your wildcard rule. If{" "}
        <code>User-agent: *</code> expresses your whole stance — open or closed — extra empty groups
        add nothing.
      </p>
      <h3>Where do these six names come from?</h3>
      <p>
        Each AI company publishes its crawler's token: OpenAI documents GPTBot, Anthropic documents
        ClaudeBot, Google documents Google-Extended, Perplexity documents PerplexityBot, Common
        Crawl documents CCBot, and Meta documents meta-externalagent. This tool checks those six
        because they are the ones most sites name today.
      </p>
    </>
  );
}
