"use client";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import type { IpLookupResult } from "@/lib/tools/ipLookup";
import { useState } from "react";

export function IpLookup() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IpLookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2 text-sm">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="8.8.8.8"
          spellCheck={false}
          className="flex-1 border bg-bg text-fg p-2 font-mono"
        />
        <button type="submit" disabled={loading} className="border px-3 py-1">
          {loading ? "looking..." : "lookup"}
        </button>
      </form>
      {result?.ok && (
        <TerminalCard label={`details · ${result.data.ip}`}>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">city</dt>
            <dd>
              {[result.data.city, result.data.region, result.data.country]
                .filter(Boolean)
                .join(", ") || "unknown"}
            </dd>
            <dt className="text-muted">coords</dt>
            <dd>{result.data.loc ?? "unknown"}</dd>
            <dt className="text-muted">asn / isp</dt>
            <dd>{result.data.org ?? "unknown"}</dd>
            <dt className="text-muted">timezone</dt>
            <dd>{result.data.timezone ?? "unknown"}</dd>
          </dl>
        </TerminalCard>
      )}
      {result && !result.ok && (
        <TerminalCard label="error">
          <span className="text-muted">{result.error}</span>
        </TerminalCard>
      )}
    </div>
  );
}
