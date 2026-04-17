import type { Metadata } from "next";
import type {
  BlogPosting,
  BreadcrumbList,
  FAQPage,
  HowTo,
  SoftwareApplication,
  WebSite,
  WithContext,
} from "schema-dts";

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
      ...(input.publishedTime && ogType === "article"
        ? { publishedTime: input.publishedTime }
        : {}),
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

export function buildWebsiteJsonLd(input: {
  siteUrl: string;
}): WithContext<WebSite> {
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

export function buildFaqJsonLd(faq: Array<{ q: string; a: string }>): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };
}

type HowToInput = {
  name: string;
  description: string;
  steps: Array<{ step: string; detail: string }>;
};

export function buildHowToJsonLd(input: HowToInput): WithContext<HowTo> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.step,
      text: s.detail,
    })),
  };
}

type BreadcrumbCrumb = { name: string; path: string };

export function buildBreadcrumbJsonLd(input: {
  crumbs: BreadcrumbCrumb[];
  siteUrl: string;
}): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${input.siteUrl}${c.path}`,
    })),
  };
}
