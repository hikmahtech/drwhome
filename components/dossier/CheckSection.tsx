import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  toolSlug: string;
  domain: string;
  status: "ok" | "timeout" | "not_applicable" | "error";
  fetchedAt?: string;
  children: ReactNode;
};

const BADGE_CLASS: Record<Props["status"], string> = {
  ok: "text-accent",
  timeout: "text-muted",
  not_applicable: "text-muted",
  error: "text-danger",
};

export function CheckSection({ title, toolSlug, domain, status, fetchedAt, children }: Props) {
  const href = `/tools/${toolSlug}?domain=${encodeURIComponent(domain)}` as Route;
  return (
    <section id={title} className="space-y-2 border-t pt-4">
      <header className="flex items-baseline justify-between gap-2 text-sm">
        <h2 className="text-sm">
          <span className="text-muted">## </span>
          {title}
          <span className={`ml-2 ${BADGE_CLASS[status]}`}>[{status}]</span>
        </h2>
        <Link href={href} className="text-accent text-xs">
          open standalone →
        </Link>
      </header>
      <div className="text-xs">{children}</div>
      {fetchedAt && <p className="text-xs text-muted">fetched {fetchedAt}</p>}
    </section>
  );
}
