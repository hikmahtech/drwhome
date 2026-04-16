"use client";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }
  return (
    <button type="button" onClick={onClick} className="border px-2 py-0.5 text-xs">
      {copied ? "copied" : "copy"}
    </button>
  );
}
