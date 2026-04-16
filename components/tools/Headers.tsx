"use client";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useEffect, useState } from "react";

export function Headers() {
  const [rows, setRows] = useState<[string, string][] | null>(null);

  useEffect(() => {
    fetch("/api/headers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.headers as [string, string][]));
  }, []);

  const asText = rows ? rows.map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">{asText && <CopyButton value={asText} />}</div>
      <TerminalCard label="request headers">
        {!rows ? (
          <span className="text-muted">loading...</span>
        ) : (
          <dl className="grid grid-cols-[min-content_1fr] gap-x-4 gap-y-1 text-xs">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted whitespace-nowrap">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </TerminalCard>
    </div>
  );
}
