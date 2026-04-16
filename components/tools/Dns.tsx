"use client";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { DNS_TYPES, type DnsResult, type DnsType } from "@/lib/tools/dns";
import { useState } from "react";

export function Dns() {
  const [name, setName] = useState("");
  const [type, setType] = useState<DnsType>("A");
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/dns?name=${encodeURIComponent(name)}&type=${type}`);
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2 text-sm flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          className="flex-1 min-w-[12rem] border bg-bg text-fg p-2 font-mono"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DnsType)}
          className="border bg-bg text-fg p-2 font-mono"
        >
          {DNS_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="border px-3 py-1">
          {loading ? "..." : "resolve"}
        </button>
      </form>
      {result?.ok && (
        <TerminalCard label={`${type} records · ${name}`}>
          {result.answers.length === 0 ? (
            <span className="text-muted">no records</span>
          ) : (
            <ul className="space-y-1 text-sm list-none p-0">
              {result.answers.map((a, i) => (
                <li key={`${a.name}-${a.data}-${i}`} className="break-all">
                  <span className="text-muted">TTL {a.TTL}s · </span>
                  {a.data}
                </li>
              ))}
            </ul>
          )}
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
