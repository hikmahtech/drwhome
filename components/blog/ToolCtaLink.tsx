"use client";

import { trackBlogToolClick } from "@/lib/analytics/client";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  postSlug: string;
  toolSlug: string;
  children: ReactNode;
};

export function ToolCtaLink({ postSlug, toolSlug, children }: Props) {
  return (
    <Link
      href={`/tools/${toolSlug}` as Route}
      onClick={() => trackBlogToolClick(postSlug, toolSlug)}
      className="inline-block border px-4 py-2 my-4 text-sm hover:border-accent"
    >
      {children}
    </Link>
  );
}
