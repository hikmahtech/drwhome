"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DossierForm({ slug, initial }: { slug: string; initial: string }) {
  const router = useRouter();
  const [input, setInput] = useState(initial);
  const [, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = input.trim();
        if (!q) return;
        start(() => router.push(`/tools/${slug}?domain=${encodeURIComponent(q)}` as Route));
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        name="domain"
        aria-label="domain"
        placeholder="example.com"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 bg-bg border px-2 py-1 text-sm"
      />
      <button type="submit" className="border px-3 py-1 text-sm">
        run
      </button>
    </form>
  );
}
