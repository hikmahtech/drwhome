export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  relatedTool?: string;
  canonical?: string;
};

export type ParseResult = { ok: true; post: Post } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFrontmatter(slug: string, raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object") return { ok: false, error: "frontmatter missing" };
  const fm = raw as Record<string, unknown>;
  const title = fm.title;
  const date = fm.date;
  const description = fm.description;
  if (typeof title !== "string" || title.length === 0)
    return { ok: false, error: "title required" };
  if (typeof date !== "string" || !ISO_DATE.test(date))
    return { ok: false, error: "date must be ISO yyyy-mm-dd" };
  if (typeof description !== "string" || description.length === 0)
    return { ok: false, error: "description required" };
  const tags = Array.isArray(fm.tags)
    ? fm.tags.filter((t): t is string => typeof t === "string")
    : [];
  const relatedTool = typeof fm.relatedTool === "string" ? fm.relatedTool : undefined;
  const canonical = typeof fm.canonical === "string" ? fm.canonical : undefined;
  return {
    ok: true,
    post: { slug, title, date, description, tags, relatedTool, canonical },
  };
}

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / 200));
}
