import { PostList } from "@/components/blog/PostList";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { posts } from "@/content/posts";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "blog",
  description: "Notes on network utilities, developer tooling, and edge web.",
  path: "/blog",
  type: "page",
});

export default function BlogIndex() {
  return (
    <section className="space-y-6">
      <TerminalPrompt>blog</TerminalPrompt>
      <p className="text-sm text-muted">
        short posts on the tools this site ships and the plumbing behind them.
      </p>
      <PostList posts={posts} />
    </section>
  );
}
