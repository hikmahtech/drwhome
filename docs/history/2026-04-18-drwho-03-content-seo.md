# drwho.me — Plan 3: Content + Full SEO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the v1 tool suite from Plan 2 into an SEO-ready, content-backed site. Add the MDX blog pipeline, ship 5 launch articles paired with their tools, wire full site-wide SEO (sitemap, robots, dynamic OG images, JSON-LD, canonical + OG + Twitter meta), and install a Lighthouse CI gate (Performance ≥ 95, SEO ≥ 95).

**Architecture:** Three orthogonal concerns, layered:
1. **Content pipeline** — `@next/mdx` reads `content/posts/*.mdx` with frontmatter parsed by `remark-mdx-frontmatter` and validated by a tiny pure-function helper in `lib/blog.ts`. Syntax highlighting via `rehype-pretty-code` + `shiki` (build-time, zero runtime cost). Posts render through the same 680px shell as tool pages.
2. **SEO plumbing** — `app/sitemap.ts` and `app/robots.ts` read the tool registry + blog registry. `app/opengraph-image.tsx` and `/tools/[slug]/opengraph-image.tsx` generate 1200×630 OG images via `next/og` at the edge. A single `lib/seo.ts` helper builds metadata objects + JSON-LD payloads from a declarative input; a `<JsonLd>` component encapsulates the script injection so pages stay declarative.
3. **Quality gate** — `@lhci/cli` runs against `pnpm build && pnpm start` via `pnpm lh`; a `.lighthouserc.json` pins thresholds. CI integration is deferred (remote isn't live yet) but the config ships wired.

**Tech Stack:** Plan 2 stack + `@next/mdx` + `@mdx-js/loader` + `@mdx-js/react` + `rehype-pretty-code` + `shiki` + `remark-frontmatter` + `remark-mdx-frontmatter` + `schema-dts` (types-only) + `@lhci/cli`. No new runtime libraries reach the client bundle.

**Reference spec:** `docs/superpowers/specs/2026-04-16-drwho-me-design.md`
**Built on:** Plan 2 (`docs/superpowers/plans/2026-04-17-drwho-02-remaining-tools.md`, tagged `plan-2-complete`)

**Out of scope (covered later):**
- MCP endpoint + paywall + waitlist (Plan 4)
- AdSense activation + consent banner + affiliate activation (Plan 5)
- GitHub Actions integration of Lighthouse CI (wired locally in Plan 3; flipped on in CI when remote exists)

---

## Invariants reaffirmed (from CLAUDE.md + prior lessons)

- `content/tools.ts` stays the single source of truth for tools. Blog gets its own parallel registry in `content/posts.ts`, populated at module load (no runtime filesystem access).
- No hardcoded colors in components. OG images get theme tokens from `lib/og.ts`, which mirrors the CSS variable values in `app/globals.css`.
- Monospace only. OG images load JetBrains Mono as an `ArrayBuffer` — the same family `next/font/google` uses at runtime.
- Dynamic `params` in Next.js 15 App Router is `Promise<{slug}>` — always `await`. (Prior lesson f388fde4.)
- `typedRoutes: true` validates every Link href at build time. Any route added to Nav/Footer must have a real page.tsx in the same commit. (Prior lesson bb6d1154.)
- Tailwind v4 needs `@config "../tailwind.config.ts"` in globals.css — already present. (Prior lesson ce563430.)
- Edge runtime on `/api/*` prevents SSG for those paths — expected. `next/og` routes use their default runtime (Node or Edge, per Next 15); we don't override.

---

## File Structure

**Created or modified by Plan 3:**

```
drwho/
├── app/
│   ├── blog/
│   │   ├── page.tsx                     # NEW — post index
│   │   ├── opengraph-image.tsx          # NEW — blog index OG
│   │   └── [slug]/
│   │       ├── page.tsx                 # NEW — MDX renderer
│   │       └── opengraph-image.tsx      # NEW — per-post OG
│   ├── tools/[slug]/
│   │   ├── page.tsx                     # MODIFIED — add JsonLd + richer metadata
│   │   └── opengraph-image.tsx          # NEW — per-tool OG
│   ├── opengraph-image.tsx              # NEW — default / home OG
│   ├── sitemap.ts                       # NEW
│   ├── robots.ts                        # NEW
│   ├── layout.tsx                       # MODIFIED — OG/Twitter defaults
│   ├── page.tsx                         # MODIFIED — add WebSite JsonLd
│   └── mdx-components.tsx               # NEW — required by @next/mdx
├── components/
│   ├── seo/
│   │   └── JsonLd.tsx                   # NEW — encapsulates JSON-LD script injection
│   ├── layout/Nav.tsx                   # MODIFIED — add /blog link
│   ├── layout/Footer.tsx                # MODIFIED — add /blog link
│   └── blog/
│       ├── PostList.tsx                 # NEW
│       └── PostMeta.tsx                 # NEW
├── content/
│   ├── posts.ts                         # NEW — blog registry
│   └── posts/
│       ├── decode-jwt-without-verifying.mdx           # NEW
│       ├── uuidv4-vs-uuidv7.mdx                       # NEW
│       ├── reading-ip-from-vercel-edge-headers.mdx    # NEW
│       ├── dns-over-https-cloudflare-primer.mdx       # NEW
│       └── base64-isnt-encryption.mdx                 # NEW
├── lib/
│   ├── blog.ts                          # NEW — frontmatter parser + reading time
│   ├── seo.ts                           # NEW — metadata + JSON-LD builders
│   └── og.ts                            # NEW — font loader + theme colours
├── public/
│   └── fonts/
│       └── JetBrainsMono-Regular.ttf    # NEW — bundled for next/og (checked in)
├── types/
│   └── mdx.d.ts                         # NEW — module declaration for *.mdx imports
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── blog.test.ts             # NEW
│   │   │   └── seo.test.ts              # NEW
│   │   ├── components/seo/
│   │   │   └── JsonLd.test.tsx          # NEW
│   │   └── content/
│   │       └── posts.test.ts            # NEW
│   └── e2e/
│       └── seo.spec.ts                  # NEW — sitemap, robots, OG, JSON-LD
├── next.config.ts                       # MODIFIED — wire withMDX, extend pageExtensions
├── vitest.config.ts                     # MODIFIED — register mdx rollup plugin
├── .lighthouserc.json                   # NEW — LHCI config
├── package.json                         # MODIFIED — new deps + `lh` script
├── README.md                            # MODIFIED — document `pnpm lh`
└── docs/notes/
    ├── og-design.md                     # NEW — OG design reference
    └── lighthouse-ci-wiring.md          # NEW — deferred CI wiring doc
```

No changes to existing tool logic (`lib/tools/*`), tool components (`components/tools/*`), or the tool registry (`content/tools.ts`).

---

## Dependency budget

Adding (all dev-time only; no client runtime cost):

- `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx` — Next.js MDX adapter and peers
- `@mdx-js/rollup` — for Vitest's Vite pipeline (so MDX fixtures can be `import`-ed from tests)
- `rehype-pretty-code`, `shiki` — build-time syntax highlighting
- `remark-frontmatter`, `remark-mdx-frontmatter` — extract YAML frontmatter into an exported `frontmatter` named export
- `schema-dts` — types-only JSON-LD types (zero runtime)
- `@lhci/cli` — Lighthouse CI runner (devDependency, invoked by `pnpm lh`)

---

## Task 1: Blog registry + frontmatter helper (pure, no Next)

**Goal:** Land a typed `content/posts.ts` registry and a pure `lib/blog.ts` helper that turns raw MDX frontmatter into typed `Post` objects. No Next.js wiring yet — this task is pure TypeScript so it's bisect-safe on its own.

**Files:**
- Create: `lib/blog.ts`
- Create: `tests/unit/lib/blog.test.ts`
- Create: `content/posts.ts`
- Create: `tests/unit/content/posts.test.ts`

- [ ] **Step 1.1: Write failing tests for `parseFrontmatter` and `readingTime`**

`tests/unit/lib/blog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseFrontmatter, readingTime } from "@/lib/blog";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter into a typed object", () => {
    const raw = {
      title: "UUIDv4 vs UUIDv7",
      date: "2026-04-18",
      description: "When to pick which UUID version.",
      tags: ["uuid", "postgres"],
      relatedTool: "uuid",
    };
    const r = parseFrontmatter("uuidv4-vs-uuidv7", raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.post.slug).toBe("uuidv4-vs-uuidv7");
      expect(r.post.title).toBe("UUIDv4 vs UUIDv7");
      expect(r.post.date).toBe("2026-04-18");
      expect(r.post.relatedTool).toBe("uuid");
      expect(r.post.tags).toEqual(["uuid", "postgres"]);
    }
  });

  it("rejects a post missing a required field", () => {
    const r = parseFrontmatter("bad", { title: "x" });
    expect(r.ok).toBe(false);
  });

  it("rejects non-ISO date", () => {
    const r = parseFrontmatter("bad-date", {
      title: "x",
      date: "April 18th",
      description: "x",
    });
    expect(r.ok).toBe(false);
  });

  it("tags defaults to [] when omitted", () => {
    const r = parseFrontmatter("ok", {
      title: "x",
      date: "2026-04-18",
      description: "x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.post.tags).toEqual([]);
  });

  it("relatedTool is optional", () => {
    const r = parseFrontmatter("ok", {
      title: "x",
      date: "2026-04-18",
      description: "x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.post.relatedTool).toBeUndefined();
  });
});

describe("readingTime", () => {
  it("returns at least 1 minute for tiny content", () => {
    expect(readingTime("hello")).toBe(1);
  });

  it("rounds up to the nearest minute at 200 wpm", () => {
    const words = Array.from({ length: 450 }, () => "word").join(" ");
    expect(readingTime(words)).toBe(3);
  });
});
```

- [ ] **Step 1.2: Run — fail**

```bash
pnpm test blog
```
Expected: FAIL (module not found).

- [ ] **Step 1.3: Implement `lib/blog.ts`**

```ts
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
  if (typeof title !== "string" || title.length === 0) return { ok: false, error: "title required" };
  if (typeof date !== "string" || !ISO_DATE.test(date)) return { ok: false, error: "date must be ISO yyyy-mm-dd" };
  if (typeof description !== "string" || description.length === 0) return { ok: false, error: "description required" };
  const tags = Array.isArray(fm.tags) ? fm.tags.filter((t): t is string => typeof t === "string") : [];
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
```

- [ ] **Step 1.4: Run — pass**

```bash
pnpm test blog
```
Expected: 7 passing.

- [ ] **Step 1.5: Write the post-registry tests**

`tests/unit/content/posts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findPost, posts } from "@/content/posts";

describe("posts registry", () => {
  it("is a valid array (populated once MDX pipeline lands in Task 3)", () => {
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThanOrEqual(0);
  });

  it("sorts posts newest-first when populated", () => {
    const dates = posts.map((p) => p.date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("every slug is unique", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("findPost returns undefined for unknown slug", () => {
    expect(findPost("does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 1.6: Create `content/posts.ts` (empty registry, populated in Task 3)**

```ts
import type { Post } from "@/lib/blog";

export const posts: Post[] = [];

export function findPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
```

Task 3 will swap this to import from MDX modules; Task 4 will populate it with the 5 launch articles. The `toBeGreaterThanOrEqual(0)` assertion keeps this task bisect-safe; Task 4 tightens it to `toBeGreaterThan(0)`.

- [ ] **Step 1.7: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

All green.

- [ ] **Step 1.8: Commit**

```bash
git add lib/blog.ts tests/unit/lib/blog.test.ts content/posts.ts tests/unit/content/posts.test.ts
git commit -m "feat(blog): pure-function frontmatter parser + empty post registry"
```

---

## Task 2: `lib/seo.ts` — metadata + JSON-LD builders (pure)

**Goal:** One place where every page type builds its `Metadata` object and its JSON-LD payload from a declarative input. Pure TypeScript, fully unit-tested, no Next.js wiring — so Tasks 5, 7, and 8 stay thin.

**Files:**
- Install: `schema-dts`
- Create: `lib/seo.ts`
- Create: `tests/unit/lib/seo.test.ts`

- [ ] **Step 2.1: Install `schema-dts`**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm add -D schema-dts
```

- [ ] **Step 2.2: Tests**

`tests/unit/lib/seo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildArticleJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebsiteJsonLd,
  pageMetadata,
} from "@/lib/seo";

describe("pageMetadata", () => {
  it("builds canonical + OG + Twitter for a tool-like page", () => {
    const m = pageMetadata({
      title: "dns lookup",
      description: "resolve DNS records.",
      path: "/tools/dns",
      type: "tool",
    });
    expect(m.alternates?.canonical).toBe("/tools/dns");
    expect(m.openGraph?.url).toBe("/tools/dns");
    expect(m.openGraph?.type).toBe("website");
    expect(m.twitter?.card).toBe("summary_large_image");
    expect(m.description).toBe("resolve DNS records.");
  });

  it("uses article type for blog posts", () => {
    const m = pageMetadata({
      title: "UUIDv4 vs UUIDv7",
      description: "When to pick which.",
      path: "/blog/uuidv4-vs-uuidv7",
      type: "article",
      publishedTime: "2026-04-18",
    });
    expect(m.openGraph?.type).toBe("article");
  });
});

describe("buildSoftwareApplicationJsonLd", () => {
  it("emits required SoftwareApplication fields", () => {
    const j = buildSoftwareApplicationJsonLd({
      name: "dns lookup",
      description: "resolve DNS records.",
      path: "/tools/dns",
      siteUrl: "https://drwho.me",
    });
    expect(j["@context"]).toBe("https://schema.org");
    expect(j["@type"]).toBe("SoftwareApplication");
    expect(j.name).toBe("dns lookup");
    expect(j.url).toBe("https://drwho.me/tools/dns");
    expect(j.applicationCategory).toBe("DeveloperApplication");
    expect(j.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
  });
});

describe("buildArticleJsonLd", () => {
  it("emits BlogPosting with headline, date, author, url", () => {
    const j = buildArticleJsonLd({
      title: "UUIDv4 vs UUIDv7",
      description: "When to pick which.",
      slug: "uuidv4-vs-uuidv7",
      date: "2026-04-18",
      siteUrl: "https://drwho.me",
    });
    expect(j["@type"]).toBe("BlogPosting");
    expect(j.headline).toBe("UUIDv4 vs UUIDv7");
    expect(j.datePublished).toBe("2026-04-18");
    expect(j.url).toBe("https://drwho.me/blog/uuidv4-vs-uuidv7");
    expect(j.author).toEqual({ "@type": "Organization", name: "Hikmah Technologies" });
  });
});

describe("buildWebsiteJsonLd", () => {
  it("emits WebSite with name + url", () => {
    const j = buildWebsiteJsonLd({ siteUrl: "https://drwho.me" });
    expect(j["@type"]).toBe("WebSite");
    expect(j.url).toBe("https://drwho.me");
    expect(j.name).toBe("drwho.me");
  });
});
```

- [ ] **Step 2.3: Run — fail (module missing)**

- [ ] **Step 2.4: Implement `lib/seo.ts`**

```ts
import type { Metadata } from "next";
import type { BlogPosting, SoftwareApplication, WebSite, WithContext } from "schema-dts";

type PageType = "tool" | "article" | "page";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  type: PageType;
  publishedTime?: string;
};

export function pageMetadata(input: MetadataInput): Metadata {
  const ogType = input.type === "article" ? "article" : "website";
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      type: ogType,
      siteName: "drwho.me",
      ...(input.publishedTime && ogType === "article" ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}

type SoftwareAppInput = {
  name: string;
  description: string;
  path: string;
  siteUrl: string;
};

export function buildSoftwareApplicationJsonLd(
  input: SoftwareAppInput,
): WithContext<SoftwareApplication> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: `${input.siteUrl}${input.path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Hikmah Technologies" },
  };
}

type ArticleInput = {
  title: string;
  description: string;
  slug: string;
  date: string;
  siteUrl: string;
};

export function buildArticleJsonLd(input: ArticleInput): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: `${input.siteUrl}/blog/${input.slug}`,
    datePublished: input.date,
    dateModified: input.date,
    author: { "@type": "Organization", name: "Hikmah Technologies" },
    publisher: { "@type": "Organization", name: "Hikmah Technologies" },
  };
}

export function buildWebsiteJsonLd(input: { siteUrl: string }): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "drwho.me",
    url: input.siteUrl,
  };
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://drwho.me";
}
```

- [ ] **Step 2.5: Run — pass**

```bash
pnpm lint && pnpm typecheck && pnpm test seo
```
Expected: 5 passing.

- [ ] **Step 2.6: Commit**

```bash
git add lib/seo.ts tests/unit/lib/seo.test.ts package.json pnpm-lock.yaml
git commit -m "feat(seo): metadata + JSON-LD builders"
```

---

## Task 3: MDX pipeline wiring

**Goal:** Hook `@next/mdx` into Next.js so `.mdx` files under `content/posts/` become importable modules with a typed `frontmatter` named export. At the end of this task, the build system can read MDX and a placeholder post proves it; real articles land in Task 4.

**Why this task stays empty of content:** splitting plumbing from content keeps each commit bisect-safe. If MDX wiring breaks, Task 3's commit is the only revert target.

**Files:**
- Install: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@mdx-js/rollup`, `@types/mdx`, `rehype-pretty-code`, `shiki`, `remark-frontmatter`, `remark-mdx-frontmatter`
- Modify: `next.config.ts`
- Modify: `vitest.config.ts`
- Create: `app/mdx-components.tsx`
- Create: `types/mdx.d.ts`
- Create: `content/posts/_example.mdx` (temporary — deleted in Task 4.6)
- Modify: `content/posts.ts` — wire the MDX module import

- [ ] **Step 3.1: Install deps**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm add @next/mdx @mdx-js/loader @mdx-js/react
pnpm add -D @mdx-js/rollup @types/mdx rehype-pretty-code shiki remark-frontmatter remark-mdx-frontmatter
```

- [ ] **Step 3.2: Create `app/mdx-components.tsx`**

Next.js expects this module when `@next/mdx` is enabled. It maps MDX elements to the site's styles. Internal links (starting with `/`) route through `next/link`; external links stay as `<a>` with `rel="noopener"`.

```tsx
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { Route } from "next";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="text-xl" {...props} />,
    h2: (props) => <h2 className="text-lg mt-6" {...props} />,
    h3: (props) => <h3 className="text-base mt-4" {...props} />,
    p: (props) => <p className="text-sm my-3" {...props} />,
    ul: (props) => <ul className="text-sm list-disc pl-5 my-3" {...props} />,
    ol: (props) => <ol className="text-sm list-decimal pl-5 my-3" {...props} />,
    li: (props) => <li className="my-1" {...props} />,
    code: (props) => <code className="text-xs" {...props} />,
    pre: (props) => (
      <pre className="border p-3 text-xs overflow-x-auto my-4 whitespace-pre" {...props} />
    ),
    a: ({ href = "", children, ...rest }) => {
      if (href.startsWith("/")) {
        return (
          <Link href={href as Route} {...rest}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} rel="noopener" {...rest}>
          {children}
        </a>
      );
    },
    ...components,
  };
}
```

- [ ] **Step 3.3: Wire `@next/mdx` into `next.config.ts`**

Replace the existing `next.config.ts` with:

```ts
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
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }]],
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  },
});

export default withMDX(config);
```

- [ ] **Step 3.4: Teach Vitest to load `.mdx`**

Replace `vitest.config.ts`:

```ts
import path from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }]],
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 3.5: Add MDX module declaration**

`types/mdx.d.ts`:

```ts
declare module "*.mdx" {
  import type { ComponentType } from "react";
  const Component: ComponentType;
  export const frontmatter: Record<string, unknown>;
  export default Component;
}
```

- [ ] **Step 3.6: Add placeholder MDX post**

`content/posts/_example.mdx`:

```mdx
---
title: placeholder
date: 2026-04-18
description: scaffolding file, replaced in Task 4.
---

placeholder.
```

The leading `_` marks this as temporary and keeps it out of production registries if we forget to delete it — Task 4.6 will rip it out explicitly.

- [ ] **Step 3.7: Populate `content/posts.ts` via explicit imports**

```ts
import type { ComponentType } from "react";
import type { Post } from "@/lib/blog";
import { parseFrontmatter } from "@/lib/blog";
import Example, { frontmatter as exampleFm } from "@/content/posts/_example.mdx";

export type PostRecord = Post & { component: ComponentType };

function record(slug: string, fm: unknown, component: ComponentType): PostRecord {
  const r = parseFrontmatter(slug, fm);
  if (!r.ok) throw new Error(`invalid frontmatter for ${slug}: ${r.error}`);
  return { ...r.post, component };
}

export const posts: PostRecord[] = [
  record("_example", exampleFm, Example),
].sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostRecord | undefined {
  return posts.find((p) => p.slug === slug);
}
```

> **Explicit imports over glob:** Next.js doesn't support `import.meta.glob`; explicit imports also keep Vitest happy and make the registry's content visible in review diffs. Task 4 adds one import per article.

- [ ] **Step 3.8: Verify**

```bash
rm -rf .next
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected:
- `_example.mdx` compiles
- `content/posts.ts` exports `posts` with one entry
- All existing unit tests still pass

- [ ] **Step 3.9: Commit**

```bash
git add app/mdx-components.tsx next.config.ts vitest.config.ts content/posts.ts content/posts/_example.mdx types/mdx.d.ts package.json pnpm-lock.yaml
git commit -m "feat(blog): MDX pipeline wired via @next/mdx + rehype-pretty-code"
```

---

## Task 4: 5 launch articles + registry population

**Goal:** Replace the placeholder with 5 real articles, each paired with a tool for SEO intent. Each article gets its own commit so git history reads as content, not scaffolding.

**Articles — pick exactly these 5:**

| Slug | Title | Pairs with | Target |
|---|---|---|---|
| `decode-jwt-without-verifying` | How to decode a JWT without verifying | `/tools/jwt` | ~900 words |
| `uuidv4-vs-uuidv7` | UUIDv4 vs UUIDv7: when to use which | `/tools/uuid` | ~900 words |
| `reading-ip-from-vercel-edge-headers` | Reading your own IP from Vercel edge headers | `/tools/ip` | ~800 words |
| `dns-over-https-cloudflare-primer` | DNS over HTTPS with Cloudflare: a quick primer | `/tools/dns` | ~900 words |
| `base64-isnt-encryption` | Base64 isn't encryption: a developer's mental model | `/tools/base64` | ~700 words |

Every article uses the same frontmatter contract:

```yaml
---
title: <exact title>
date: 2026-04-18
description: <1-2 sentences, 150 char target>
tags: [tag1, tag2, tag3]
relatedTool: <slug>
---
```

And the same body rhythm:
- One-paragraph hook
- 2-3 `##` sections
- One `## try it` section at the end linking to the paired tool
- At least one fenced code block with a language tag (so `rehype-pretty-code` is exercised per post)

### 4.1 — `decode-jwt-without-verifying.mdx`

- [ ] **Step 4.1.1: Write the MDX post**

`content/posts/decode-jwt-without-verifying.mdx`:

```mdx
---
title: How to decode a JWT without verifying
date: 2026-04-18
description: Inspecting a token's payload is a read operation. Verification is a trust decision. They are not the same step, and conflating them causes auth bugs.
tags: [jwt, auth, security]
relatedTool: jwt
---

A JWT is just three base64url-encoded strings joined by dots. Decoding one tells you what a token **claims**. It does **not** tell you whether those claims are true. Conflating the two is the single most common JWT mistake.

## What "decoding" actually does

The header and payload are plain JSON once you base64url-decode them. Anyone can read them — that's why you never put secrets in a JWT payload. The signature is a MAC (HMAC) or asymmetric signature over `base64url(header) + "." + base64url(payload)`, computed with a secret or private key. Decoding doesn't check it.

\`\`\`ts
const [headerB64, payloadB64] = token.split(".");
const b64url = (s: string) => s.replaceAll("-", "+").replaceAll("_", "/");
const header = JSON.parse(atob(b64url(headerB64)));
const payload = JSON.parse(atob(b64url(payloadB64)));
\`\`\`

That's it. No crypto, no network, nothing to trust yet.

## When decoding is enough

Three places where read-only decoding is the right tool:

- **Debugging.** "What's in this token my backend just issued?" — paste it into a decoder, read the claims, move on.
- **Client UI hints.** Showing the user's name from `payload.name` without re-fetching. Never make auth decisions on this — the server must verify.
- **Observability.** Logging `iss` / `aud` / `sub` for correlation in tracing.

In all three, we're reading what the token says about itself. None of them are trust decisions.

## When it is not

Anywhere the answer to "should this request succeed?" depends on the token being genuine. API gateways, middleware, authorization checks. For those, verify the signature against the issuer's key (RS256 / ES256 fetched from a JWKS endpoint; HS256 with your shared secret) and also validate `exp`, `nbf`, `iss`, and `aud`. A decoder that doesn't do this is a debugging tool, not an auth library.

The classic bug: code that reads `payload.role === "admin"` and grants access without verifying. Anyone can craft a token with whatever role they want — only the signature makes it authentic.

## try it

Paste any token into [/tools/jwt](/tools/jwt) — the decoder runs entirely in your browser, never sends the token anywhere, and prints the header + payload + raw signature. It does not verify. That's intentional.
```

> The subagent writing this content should extend the `##` sections by ~2 more paragraphs each to reach ~900 words total. Keep the code-fence language tag. Keep one internal link (to `/tools/jwt`) and no external links.

- [ ] **Step 4.1.2: Add to `content/posts.ts`**

Replace the `_example` import/record with the real article:

```ts
import type { ComponentType } from "react";
import type { Post } from "@/lib/blog";
import { parseFrontmatter } from "@/lib/blog";
import Jwt, { frontmatter as jwtFm } from "@/content/posts/decode-jwt-without-verifying.mdx";
import Example, { frontmatter as exampleFm } from "@/content/posts/_example.mdx";

export type PostRecord = Post & { component: ComponentType };

function record(slug: string, fm: unknown, component: ComponentType): PostRecord {
  const r = parseFrontmatter(slug, fm);
  if (!r.ok) throw new Error(`invalid frontmatter for ${slug}: ${r.error}`);
  return { ...r.post, component };
}

export const posts: PostRecord[] = [
  record("decode-jwt-without-verifying", jwtFm, Jwt),
  record("_example", exampleFm, Example),
].sort((a, b) => b.date.localeCompare(a.date));

export function findPost(slug: string): PostRecord | undefined {
  return posts.find((p) => p.slug === slug);
}
```

- [ ] **Step 4.1.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/decode-jwt-without-verifying.mdx content/posts.ts
git commit -m "docs(blog): add decode-jwt-without-verifying"
```

### 4.2 — `uuidv4-vs-uuidv7.mdx`

- [ ] **Step 4.2.1: Write the MDX post**

Open with the problem (random UUIDs + btree indexes + page fragmentation). Cover: v4 is 122 bits of random; v7 prepends a 48-bit unix-ms timestamp → monotonic → index-friendly. Mention Postgres `uuidv7()` (native in pg17; earlier via `pg_uuidv7` extension). Include one fenced code block showing the v7 layout. End with `## try it` → `[/tools/uuid](/tools/uuid)`. Same frontmatter shape as 4.1.

- [ ] **Step 4.2.2: Add to `content/posts.ts`**

Add import:

```ts
import Uuid, { frontmatter as uuidFm } from "@/content/posts/uuidv4-vs-uuidv7.mdx";
```

Add record entry to the `posts` array:

```ts
record("uuidv4-vs-uuidv7", uuidFm, Uuid),
```

- [ ] **Step 4.2.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/uuidv4-vs-uuidv7.mdx content/posts.ts
git commit -m "docs(blog): add uuidv4-vs-uuidv7"
```

### 4.3 — `reading-ip-from-vercel-edge-headers.mdx`

- [ ] **Step 4.3.1: Write the MDX post**

Open with `x-forwarded-for` vs `x-real-ip` vs `x-vercel-forwarded-for`. Cover: XFF format (comma-separated chain), why you want the leftmost public IP, Vercel's `x-vercel-ip-*` geolocation headers (country, city, region, latitude, longitude, timezone). Include a fenced code block pulling the IP inside a Next.js route handler via `headers()`. End with `## try it` → `[/tools/ip](/tools/ip)`.

- [ ] **Step 4.3.2: Add to `content/posts.ts`**

```ts
import Ip, { frontmatter as ipFm } from "@/content/posts/reading-ip-from-vercel-edge-headers.mdx";
// ...
record("reading-ip-from-vercel-edge-headers", ipFm, Ip),
```

- [ ] **Step 4.3.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/reading-ip-from-vercel-edge-headers.mdx content/posts.ts
git commit -m "docs(blog): add reading-ip-from-vercel-edge-headers"
```

### 4.4 — `dns-over-https-cloudflare-primer.mdx`

- [ ] **Step 4.4.1: Write the MDX post**

Open with the problem (plaintext DNS → leaks + tampering). Cover: DoH = HTTPS GET/POST to a resolver, Cloudflare's `/dns-query` endpoint, JSON vs wireformat (`Accept: application/dns-json` vs `application/dns-message`). Include both a `curl` example and a `fetch()` example matching what `lib/tools/dns.ts` does. End with `## try it` → `[/tools/dns](/tools/dns)`.

- [ ] **Step 4.4.2: Add to `content/posts.ts`**

```ts
import Dns, { frontmatter as dnsFm } from "@/content/posts/dns-over-https-cloudflare-primer.mdx";
// ...
record("dns-over-https-cloudflare-primer", dnsFm, Dns),
```

- [ ] **Step 4.4.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/dns-over-https-cloudflare-primer.mdx content/posts.ts
git commit -m "docs(blog): add dns-over-https-cloudflare-primer"
```

### 4.5 — `base64-isnt-encryption.mdx`

- [ ] **Step 4.5.1: Write the MDX post**

Short and blunt. Base64 is an encoding. Encoding is reversible with no secret. Cover valid uses (binary → text transport for email/JWT segments/data URIs; basic-auth credentials — the last of which is auth, not encryption; TLS is doing the security work). Warn against the "hide it in base64" pattern. Include one fenced code block showing `atob`/`btoa`. End with `## try it` → `[/tools/base64](/tools/base64)`.

- [ ] **Step 4.5.2: Add to `content/posts.ts`**

```ts
import Base64, { frontmatter as base64Fm } from "@/content/posts/base64-isnt-encryption.mdx";
// ...
record("base64-isnt-encryption", base64Fm, Base64),
```

- [ ] **Step 4.5.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/base64-isnt-encryption.mdx content/posts.ts
git commit -m "docs(blog): add base64-isnt-encryption"
```

### 4.6 — Remove placeholder + tighten assertion

- [ ] **Step 4.6.1: Delete placeholder + remove its import**

```bash
rm content/posts/_example.mdx
```

Edit `content/posts.ts` — remove the `_example` import and the `record("_example", ...)` line. Final file should import all 5 real posts and nothing else.

- [ ] **Step 4.6.2: Tighten the registry assertion**

In `tests/unit/content/posts.test.ts`, change the first test back to non-empty:

```ts
  it("is non-empty", () => {
    expect(posts.length).toBeGreaterThan(0);
  });
```

And add a coverage check:

```ts
  it("contains all 5 launch articles", () => {
    const slugs = posts.map((p) => p.slug).sort();
    expect(slugs).toEqual([
      "base64-isnt-encryption",
      "decode-jwt-without-verifying",
      "dns-over-https-cloudflare-primer",
      "reading-ip-from-vercel-edge-headers",
      "uuidv4-vs-uuidv7",
    ]);
  });
```

- [ ] **Step 4.6.3: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add content/posts/_example.mdx content/posts.ts tests/unit/content/posts.test.ts
git commit -m "chore(blog): remove scaffolding placeholder"
```

---

## Task 5: `JsonLd` component (encapsulates script injection)

**Goal:** A single, well-tested component for JSON-LD payloads so page files never set HTML attributes directly. Keeps SEO plumbing declarative and lets Biome/linters ignore just this one file.

**Files:**
- Create: `components/seo/JsonLd.tsx`
- Create: `tests/unit/components/seo/JsonLd.test.tsx`

- [ ] **Step 5.1: Test**

`tests/unit/components/seo/JsonLd.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json and serialized JSON", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: "drwho.me" }} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const parsed = JSON.parse(script?.textContent ?? "{}");
    expect(parsed["@type"]).toBe("WebSite");
    expect(parsed.name).toBe("drwho.me");
  });

  it("escapes the </script> sequence to prevent injection", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Thing", name: "</script><img>" }} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const raw = script?.innerHTML ?? "";
    expect(raw).not.toContain("</script>");
    expect(raw).toContain("\\u003c/script\\u003e");
  });
});
```

- [ ] **Step 5.2: Run — fail**

- [ ] **Step 5.3: Implement `components/seo/JsonLd.tsx`**

```tsx
type Props = { data: unknown };

function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: Props) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON inside a script tag; input escapes < to block </script> injection.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}
```

The `\u003c` replacement blocks the only injection vector for JSON-LD inside an HTML script tag (a stray `</script>` closing the element); Google still parses the escaped form correctly.

- [ ] **Step 5.4: Run — pass**

```bash
pnpm lint && pnpm typecheck && pnpm test JsonLd
```

- [ ] **Step 5.5: Commit**

```bash
git add components/seo/JsonLd.tsx tests/unit/components/seo/JsonLd.test.tsx
git commit -m "feat(seo): JsonLd component with script-sequence escaping"
```

---

## Task 6: Blog routes + PostList / PostMeta components

**Goal:** `/blog` index + `/blog/[slug]` dynamic route render MDX through the standard shell. Blog link lands in Nav and Footer.

**Files:**
- Create: `components/blog/PostMeta.tsx`
- Create: `components/blog/PostList.tsx`
- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Modify: `components/layout/Nav.tsx`
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 6.1: `components/blog/PostMeta.tsx`**

```tsx
import type { Post } from "@/lib/blog";

export function PostMeta({ post }: { post: Post }) {
  return (
    <p className="text-xs text-muted">
      <time dateTime={post.date}>{post.date}</time>
      {post.tags.length > 0 && <> · {post.tags.join(" · ")}</>}
    </p>
  );
}
```

- [ ] **Step 6.2: `components/blog/PostList.tsx`**

```tsx
import type { Post } from "@/lib/blog";
import Link from "next/link";
import type { Route } from "next";
import { PostMeta } from "./PostMeta";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="space-y-6 list-none p-0">
      {posts.map((post) => (
        <li key={post.slug} className="border-b pb-5 last:border-b-0">
          <Link
            href={`/blog/${post.slug}` as Route}
            className="no-underline text-fg block"
          >
            <h2 className="text-base text-fg">{post.title}</h2>
          </Link>
          <PostMeta post={post} />
          <p className="text-sm mt-2">{post.description}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 6.3: `app/blog/page.tsx`**

```tsx
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
```

- [ ] **Step 6.4: `app/blog/[slug]/page.tsx`**

```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PostMeta } from "@/components/blog/PostMeta";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findPost, posts } from "@/content/posts";
import { findTool } from "@/content/tools";
import { buildArticleJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "not found" };
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const MDX = post.component;
  const tool = post.relatedTool ? findTool(post.relatedTool) : undefined;
  const jsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    date: post.date,
    siteUrl: siteUrl(),
  });

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/blog/${post.slug}`} />
      <TerminalPrompt>{post.title}</TerminalPrompt>
      <PostMeta post={post} />
      <div>
        <MDX />
      </div>
      {tool && (
        <aside className="border-t pt-4 mt-8 text-sm">
          related tool:{" "}
          <Link href={`/tools/${tool.slug}` as Route}>/tools/{tool.slug}</Link>
        </aside>
      )}
      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 6.5: Add `/blog` to Nav and Footer**

`components/layout/Nav.tsx`:

```tsx
import { ThemeToggle } from "@/components/terminal/ThemeToggle";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-content mx-auto px-4 py-3 flex items-center justify-between border-b">
      <Link href="/" className="no-underline text-fg">
        drwho
        <span className="cursor" />
      </Link>
      <div className="flex items-center gap-4 text-xs">
        <Link href="/#tools">tools</Link>
        <Link href="/blog">blog</Link>
        <Link href="/about">about</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
```

`components/layout/Footer.tsx` (add `/blog` alongside the existing links):

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full max-w-content mx-auto px-4 py-6 mt-12 border-t text-xs text-muted">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/about">about</Link>
        <Link href="/blog">blog</Link>
        <Link href="/privacy">privacy</Link>
        <Link href="/terms">terms</Link>
        <Link href="/contact">contact</Link>
        <span className="ml-auto">
          © {new Date().getFullYear()}{" "}
          <a href="https://hikmahtechnologies.com" rel="noopener">
            hikmah technologies
          </a>
        </span>
      </div>
      <p className="mt-3">
        drwho.me contains affiliate links. See <Link href="/privacy#affiliates">disclosure</Link>.
      </p>
    </footer>
  );
}
```

> **Prior lesson bb6d1154:** Nav's new `/blog` link requires `app/blog/page.tsx` to exist in the same commit — otherwise `typedRoutes` fails the build. Steps 6.1-6.5 ship together.

- [ ] **Step 6.6: Verify**

```bash
rm -rf .next
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected build output: `/blog` listed as `●` (SSG) plus 5 `●` routes for each blog post slug.

- [ ] **Step 6.7: Commit**

```bash
git add app/blog components/blog components/layout/Nav.tsx components/layout/Footer.tsx
git commit -m "feat(blog): /blog index and /blog/[slug] routes"
```

---

## Task 7: sitemap.ts + robots.ts

**Goal:** Ship `sitemap.xml` + `robots.txt` endpoints, reading from both registries.

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 7.1: `app/sitemap.ts`**

```ts
import { posts } from "@/content/posts";
import { tools } from "@/content/tools";
import { siteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const toolPaths: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));
  const postPaths: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticPaths, ...toolPaths, ...postPaths];
}
```

- [ ] **Step 7.2: `app/robots.ts`**

```ts
import { siteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
```

- [ ] **Step 7.3: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Spot-check by running `pnpm start` and curling both in another terminal:

```bash
pnpm start
# in another terminal:
curl -s http://localhost:3000/sitemap.xml | head -40
curl -s http://localhost:3000/robots.txt
```

Expected: XML with every tool + post URL; robots allowing `/` and pointing at `/sitemap.xml`.

- [ ] **Step 7.4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat(seo): sitemap + robots"
```

---

## Task 8: Dynamic OG images via next/og

**Goal:** Every indexable page gets a monospace 1200×630 OG image, generated by `next/og`. One default at the app root, one per tool, one per blog post, and a minimal variant for `/blog`.

**Files:**
- Create: `public/fonts/JetBrainsMono-Regular.ttf`
- Create: `lib/og.ts`
- Create: `app/opengraph-image.tsx`
- Create: `app/tools/[slug]/opengraph-image.tsx`
- Create: `app/blog/[slug]/opengraph-image.tsx`
- Create: `app/blog/opengraph-image.tsx`
- Create: `docs/notes/og-design.md`

- [ ] **Step 8.1: Download JetBrains Mono**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
mkdir -p public/fonts
curl -L -o public/fonts/JetBrainsMono-Regular.ttf \
  https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf
ls -la public/fonts/JetBrainsMono-Regular.ttf
```

Expected: ~280KB file. If the download fails, fall back to Google Fonts' direct download of the same file.

- [ ] **Step 8.2: `lib/og.ts`**

```ts
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export const OG_COLORS = {
  bg: "#0a0a0a",
  fg: "#d4d4d4",
  muted: "#737373",
  accent: "#4ade80",
  border: "#1f1f1f",
} as const;

export async function loadMonoFont(): Promise<ArrayBuffer> {
  const res = await fetch(new URL("../public/fonts/JetBrainsMono-Regular.ttf", import.meta.url));
  if (!res.ok) throw new Error(`font load failed: ${res.status}`);
  return await res.arrayBuffer();
}
```

- [ ] **Step 8.3: `app/opengraph-image.tsx` (default / home)**

```tsx
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;
export const alt = "drwho.me — network + dev tools";

export default async function OG() {
  const font = await loadMonoFont();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
        fontSize: 64,
      }}
    >
      <div style={{ color: OG_COLORS.accent }}>&gt; drwho.me</div>
      <div style={{ color: OG_COLORS.muted, fontSize: 32, marginTop: 24 }}>
        network + dev tools.
      </div>
      <div style={{ color: OG_COLORS.muted, fontSize: 28, marginTop: 8 }}>
        minimal and fast.
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 8.4: `app/tools/[slug]/opengraph-image.tsx`**

```tsx
import { findTool, tools } from "@/content/tools";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
  const font = await loadMonoFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ fontSize: 24, color: OG_COLORS.muted }}>~/tools/{tool.slug}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 80, color: OG_COLORS.accent }}>&gt; {tool.name}</div>
        <div style={{ fontSize: 32, color: OG_COLORS.muted, marginTop: 24, maxWidth: 1000 }}>
          {tool.description}
        </div>
      </div>
      <div style={{ fontSize: 24, color: OG_COLORS.muted }}>drwho.me</div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 8.5: `app/blog/[slug]/opengraph-image.tsx`**

```tsx
import { findPost, posts } from "@/content/posts";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const font = await loadMonoFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ fontSize: 24, color: OG_COLORS.muted }}>~/blog/{post.slug}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 56, color: OG_COLORS.fg, lineHeight: 1.2 }}>{post.title}</div>
        <div style={{ fontSize: 28, color: OG_COLORS.muted, marginTop: 24, maxWidth: 1000 }}>
          {post.description}
        </div>
      </div>
      <div style={{ fontSize: 24, color: OG_COLORS.muted }}>
        {post.date} · drwho.me
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 8.6: `app/blog/opengraph-image.tsx` (blog index)**

```tsx
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, loadMonoFont } from "@/lib/og";
import { ImageResponse } from "next/og";

export const contentType = OG_CONTENT_TYPE;
export const size = OG_SIZE;
export const alt = "drwho.me — blog";

export default async function OG() {
  const font = await loadMonoFont();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "JetBrains Mono",
        fontSize: 80,
      }}
    >
      <div style={{ color: OG_COLORS.accent }}>&gt; blog</div>
      <div style={{ color: OG_COLORS.muted, fontSize: 28, marginTop: 24 }}>
        drwho.me
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "JetBrains Mono", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 8.7: Document + verify**

Create `docs/notes/og-design.md`:

```md
# OG image design notes

- Canvas: 1200×630.
- Background: `--bg` dark (#0a0a0a). OG previews are consumed on dark surfaces (Slack/Twitter), so the light theme is intentionally not used.
- Font: JetBrains Mono, bundled under `public/fonts/`, loaded as ArrayBuffer into `next/og`.
- Template: breadcrumb (top) · title + description (middle) · brand (bottom).
- Title colour: `--accent` green for tool pages; `--fg` for blog posts — blog titles are longer and need higher density.
- If `lib/og.ts` colours drift from `app/globals.css`, update both.
```

Verify:

```bash
rm -rf .next
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Smoke test locally — run `pnpm start` in one terminal, then in another:

```bash
curl -sI http://localhost:3000/opengraph-image
curl -sI http://localhost:3000/tools/base64/opengraph-image
curl -sI http://localhost:3000/blog/decode-jwt-without-verifying/opengraph-image
```

Expected: `HTTP/1.1 200 OK` + `content-type: image/png` on all three.

- [ ] **Step 8.8: Commit**

```bash
git add public/fonts/JetBrainsMono-Regular.ttf lib/og.ts app/opengraph-image.tsx app/tools/[slug]/opengraph-image.tsx app/blog/[slug]/opengraph-image.tsx app/blog/opengraph-image.tsx docs/notes/og-design.md
git commit -m "feat(seo): dynamic OG images via next/og"
```

---

## Task 9: JSON-LD + metadata refresh on tool + home pages

**Goal:** Tool pages ship `SoftwareApplication` JSON-LD; home ships `WebSite` JSON-LD; all tool metadata flows through `pageMetadata` so OG/Twitter tags are uniform.

**Files:**
- Modify: `app/tools/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 9.1: `app/tools/[slug]/page.tsx`**

```tsx
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findTool, tools } from "@/content/tools";
import { buildSoftwareApplicationJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return { title: "not found" };
  return {
    ...pageMetadata({
      title: tool.name,
      description: tool.description,
      path: `/tools/${tool.slug}`,
      type: "tool",
    }),
    keywords: tool.keywords,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();
  const Component = tool.component;
  const jsonLd = buildSoftwareApplicationJsonLd({
    name: tool.name,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    siteUrl: siteUrl(),
  });

  return (
    <article className="space-y-4">
      <Breadcrumb path={`~/tools/${slug}`} />
      <TerminalPrompt>{tool.name}</TerminalPrompt>
      <p className="text-sm text-muted">{tool.description}</p>
      <Component />
      <AdSlot slot={`tool-${slug}`} />
      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 9.2: `app/page.tsx` — add WebSite JSON-LD**

Update imports at top:

```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { buildWebsiteJsonLd, siteUrl } from "@/lib/seo";
```

At the very bottom of the returned JSX, just before `</div>`:

```tsx
      <JsonLd data={buildWebsiteJsonLd({ siteUrl: siteUrl() })} />
```

- [ ] **Step 9.3: `app/layout.tsx` — OG + Twitter defaults**

Update the `metadata` export:

```tsx
export const metadata: Metadata = {
  title: { default: "drwho.me — network + dev tools", template: "%s — drwho.me" },
  description: "Minimal, fast network and developer tools. No signup.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://drwho.me"),
  openGraph: {
    siteName: "drwho.me",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

- [ ] **Step 9.4: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Run `pnpm start` in one terminal, then in another:

```bash
curl -s http://localhost:3000/tools/jwt | grep -c 'application/ld+json'
curl -s http://localhost:3000/ | grep -c 'WebSite'
curl -s http://localhost:3000/tools/jwt | grep -c 'og:image'
```

All three should return `1` or higher.

- [ ] **Step 9.5: Commit**

```bash
git add app/tools/[slug]/page.tsx app/page.tsx app/layout.tsx
git commit -m "feat(seo): JSON-LD + OG/Twitter meta on tool + home"
```

---

## Task 10: E2E SEO smoke tests

**Goal:** Playwright asserts the SEO endpoints and meta tags actually land.

**Files:**
- Create: `tests/e2e/seo.spec.ts`

- [ ] **Step 10.1: `tests/e2e/seo.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("sitemap.xml lists tool and blog pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("/tools/base64");
  expect(body).toContain("/tools/dns");
  expect(body).toContain("/blog/decode-jwt-without-verifying");
});

test("robots.txt allows all and points at sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/User-Agent: \*/i);
  expect(body).toMatch(/Sitemap:.*\/sitemap\.xml/i);
});

test("tool page has SoftwareApplication JSON-LD", async ({ page }) => {
  await page.goto("/tools/jwt");
  const json = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(json).toBeTruthy();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("SoftwareApplication");
  expect(parsed.name).toBe("jwt decoder");
});

test("blog post page has BlogPosting JSON-LD", async ({ page }) => {
  await page.goto("/blog/decode-jwt-without-verifying");
  const json = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("BlogPosting");
  expect(parsed.headline).toContain("JWT");
});

test("home page has WebSite JSON-LD", async ({ page }) => {
  await page.goto("/");
  const json = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const parsed = JSON.parse(json ?? "{}");
  expect(parsed["@type"]).toBe("WebSite");
});

test("blog index page renders all 5 launch posts", async ({ page }) => {
  await page.goto("/blog");
  for (const slug of [
    "decode-jwt-without-verifying",
    "uuidv4-vs-uuidv7",
    "reading-ip-from-vercel-edge-headers",
    "dns-over-https-cloudflare-primer",
    "base64-isnt-encryption",
  ]) {
    await expect(page.locator(`a[href="/blog/${slug}"]`)).toBeVisible();
  }
});

test("blog post renders MDX with a rendered code block", async ({ page }) => {
  await page.goto("/blog/decode-jwt-without-verifying");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/JWT/i);
  await expect(page.locator("pre").first()).toBeVisible();
});

test("OG image endpoints respond with image/png", async ({ request }) => {
  for (const path of [
    "/opengraph-image",
    "/tools/base64/opengraph-image",
    "/blog/decode-jwt-without-verifying/opengraph-image",
  ]) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test("tool page has canonical + og:image meta", async ({ page }) => {
  await page.goto("/tools/dns");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toContain("/tools/dns");
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(ogImage).toBeTruthy();
});
```

- [ ] **Step 10.2: Run**

```bash
pnpm test:e2e
```

Expected: ~18 tests pass (10 pre-existing + 8 new SEO + 1 blog MDX). Fix any failures by adjusting markup or selectors — never weaken the tests.

- [ ] **Step 10.3: Commit**

```bash
git add tests/e2e/seo.spec.ts
git commit -m "test(e2e): SEO surfaces — sitemap, robots, JSON-LD, OG"
```

---

## Task 11: Lighthouse CI local gate

**Goal:** `pnpm lh` runs Lighthouse against a local build and fails if Performance or SEO < 95. CI wiring is captured in a separate note (Task 12) since the remote repo doesn't exist yet.

**Files:**
- Install: `@lhci/cli`
- Create: `.lighthouserc.json`
- Modify: `package.json` (add `lh` script)
- Modify: `README.md` (document `pnpm lh`)

- [ ] **Step 11.1: Install `@lhci/cli`**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm add -D @lhci/cli
```

- [ ] **Step 11.2: `.lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "startServerReadyPattern": "Ready in",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/tools/base64",
        "http://localhost:3000/tools/jwt",
        "http://localhost:3000/tools/dns",
        "http://localhost:3000/blog",
        "http://localhost:3000/blog/decode-jwt-without-verifying"
      ],
      "numberOfRuns": 1,
      "settings": {
        "preset": "desktop",
        "chromeFlags": "--no-sandbox --headless=new"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["warn", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 11.3: Add `lh` script to `package.json`**

In the `scripts` block, alongside `test` and `test:e2e`:

```json
"lh": "pnpm build && lhci autorun"
```

- [ ] **Step 11.4: Run locally**

```bash
pnpm lh
```

Expected: build succeeds, lhci runs against 6 URLs, all assertions pass. If Performance or SEO < 95 on any URL, investigate:

- **Performance**: check the waterfall. Shiki runs at build time so there's no runtime JS cost. Likely culprits are CSS render-blocking or OG image fetches bleeding into the initial load.
- **SEO**: check for missing `lang` attribute, missing meta description, or linked-but-unreachable URLs.
- **Accessibility** (warn, not fail): colour contrast in the dark theme if the `muted` token drops below 4.5:1 against `bg`.

Fix iteratively until green. If Lighthouse insists on failing for a reason we disagree with, consider whether the rule is correct before weakening the assertion — default to fixing the site.

- [ ] **Step 11.5: README update**

Append to `README.md` under `## Dev` (between `pnpm test:e2e` and `pnpm build`):

```md
pnpm lh            # Lighthouse CI against a local build (gates perf/seo ≥ 95)
```

- [ ] **Step 11.6: Commit**

```bash
git add .lighthouserc.json package.json pnpm-lock.yaml README.md
git commit -m "chore(ci): Lighthouse gate via pnpm lh (perf/seo >= 95)"
```

---

## Task 12: CI wiring plan (deferred, documented now)

**Goal:** Record how Lighthouse CI plugs into GitHub Actions so the work is zero-ambiguity once the remote repo is live. No code changes — the GH Actions workflow stays as-is until the remote exists.

**Files:**
- Create: `docs/notes/lighthouse-ci-wiring.md`

- [ ] **Step 12.1: Write the spec stub**

`docs/notes/lighthouse-ci-wiring.md`:

```md
# Lighthouse CI — GitHub Actions wiring (deferred until remote exists)

When `hikmahtech/drwho` goes live, add this job to `.github/workflows/ci.yml`:

\`\`\`yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-report
          path: .lighthouseci/
          retention-days: 14
\`\`\`

Branch protection on `main`: require the `lighthouse` status check to pass.

This is a no-op until the remote exists. LHCI against `pnpm start` works locally, and that's the gate we use until deploy.
```

- [ ] **Step 12.2: Commit**

```bash
git add docs/notes/lighthouse-ci-wiring.md
git commit -m "docs: Lighthouse CI wiring plan (for post-remote)"
```

---

## Task 13: Final verification + tag

- [ ] **Step 13.1: Full gate**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
rm -rf .next
pnpm install
pnpm lint
pnpm typecheck
pnpm test          # expect 16+ test files, all green
pnpm build         # expect home + 10 tool routes + /blog + 5 blog routes + sitemap + robots + 4 og routes
pnpm test:e2e      # expect 18+ tests passing
pnpm lh            # expect Lighthouse ≥ 95 perf + seo on all 6 URLs
```

All must pass.

- [ ] **Step 13.2: Manual sanity check**

```bash
pnpm dev
```

Browse and verify:
- `/` — home has WebSite JSON-LD in page source (view-source or inspector), nav shows `blog` link
- `/blog` — post list with 5 posts, newest first
- `/blog/decode-jwt-without-verifying` — MDX renders, code block has syntax highlighting, related-tool link → `/tools/jwt`, BlogPosting JSON-LD present, `og:image` meta points at `/blog/decode-jwt-without-verifying/opengraph-image`
- `/tools/jwt` — SoftwareApplication JSON-LD present
- `/sitemap.xml` — lists all 10 tools + 5 posts + static pages
- `/robots.txt` — allows `/`, points at sitemap
- `/opengraph-image` — renders as a PNG in the browser tab

Kill dev server when done.

- [ ] **Step 13.3: Tag**

```bash
git tag -a plan-3-complete -m "drwho.me content + SEO complete: blog pipeline, 5 launch articles, full SEO, Lighthouse gate"
```

---

## Done when

- MDX blog pipeline live — `@next/mdx` + `rehype-pretty-code` + `shiki`, 5 real articles each paired with a tool
- `/blog` and `/blog/[slug]` routes shipped; Nav + Footer link to `/blog`
- `sitemap.xml` + `robots.txt` generated from both registries
- Per-route OG images via `next/og` — home, blog index, blog post, tool page all covered
- JSON-LD on every indexable page (WebSite, SoftwareApplication, BlogPosting), injected through a tested `JsonLd` component
- Full OG + Twitter + canonical meta on every page via `pageMetadata` helper
- 18+ Playwright E2E tests, all green
- `pnpm lh` gates Performance ≥ 95 and SEO ≥ 95 on 6 representative URLs
- `docs/notes/lighthouse-ci-wiring.md` captures the deferred GH Actions step
- Tag `plan-3-complete`

## Next

**Plan 4** (MCP): `@vercel/mcp-adapter` endpoint + paywall stub + `/mcp` landing + waitlist form.

**Plan 5** (monetization): AdSense script wiring + consent banner + affiliate activation on IP/DNS/JWT pages after AdSense approval.
