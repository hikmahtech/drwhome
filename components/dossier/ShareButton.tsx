"use client";

import { trackDossierShared } from "@/lib/analytics/client";
import { useState } from "react";

type Props = {
  domain: string;
  href: string;
};

export function ShareButton({ domain, href }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(href);
      trackDossierShared(domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, permission denied). Swallow.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm underline decoration-dotted underline-offset-4 hover:text-accent"
      aria-label="copy link"
    >
      {copied ? "copied →" : "copy link →"}
    </button>
  );
}
