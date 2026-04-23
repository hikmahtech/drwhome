import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  keepBackground: false,
};

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  output: "standalone",
  // Render metadata synchronously in the initial HTML instead of streaming it
  // via AsyncMetadataOutlet. Lighthouse (not in Next.js's default HTML-limited-bots
  // list) snapshots the DOM before the streamed metadata resolves, failing the
  // SEO meta-description audit. Matching all UAs forces blocking metadata.
  htmlLimitedBots: /.*/,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }]],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  },
});

export default withMDX(config);
