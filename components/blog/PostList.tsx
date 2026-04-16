import type { Post } from "@/lib/blog";
import type { Route } from "next";
import Link from "next/link";
import { PostMeta } from "./PostMeta";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="space-y-6 list-none p-0">
      {posts.map((post) => (
        <li key={post.slug} className="border-b pb-5 last:border-b-0">
          <Link href={`/blog/${post.slug}` as Route} className="no-underline text-fg block">
            <h2 className="text-base text-fg">{post.title}</h2>
          </Link>
          <PostMeta post={post} />
          <p className="text-sm mt-2">{post.description}</p>
        </li>
      ))}
    </ul>
  );
}
