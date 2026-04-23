"use client";

import { trackMcpInstallClick } from "@/lib/analytics/client";
import { useState } from "react";

type Props = {
  client: string;
  config: string;
};

export function McpInstallButton({ client, config }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(config);
      trackMcpInstallClick(client);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // swallow: insecure context
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm border px-3 py-1 hover:border-accent"
    >
      {copied ? "copied" : "copy config"}
    </button>
  );
}
