"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DomainInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = value.trim().toLowerCase();
    if (!d) return;
    router.push(`/d/${d}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="example.com"
        className="flex-1 bg-transparent border px-3 py-2 text-sm font-mono outline-none focus:border-accent"
        aria-label="domain"
      />
      <button type="submit" className="border px-4 py-2 text-sm hover:border-accent">
        run →
      </button>
    </form>
  );
}
