import type { Post } from "@/lib/blog";

export function PostMeta({ post }: { post: Post }) {
  return (
    <p className="text-xs text-muted">
      <time dateTime={post.date}>{post.date}</time>
      {post.tags.length > 0 && <> · {post.tags.join(" · ")}</>}
    </p>
  );
}
