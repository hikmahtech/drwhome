import type { Tool } from "@/content/tools";
import Link from "next/link";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="border p-4 no-underline text-fg hover:border-accent block"
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-base">{tool.name}</span>
        <span className="text-xs text-muted">{tool.category}</span>
      </div>
      <p className="text-xs text-muted">{tool.description}</p>
    </Link>
  );
}
