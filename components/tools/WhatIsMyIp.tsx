"use client";
import type { WhoamiResponse } from "@/app/api/whoami/route";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useCallback, useEffect, useState } from "react";

export function WhatIsMyIp() {
  const [data, setData] = useState<WhoamiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whoami", { cache: "no-store" });
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={load} className="border px-2 py-0.5">
          refresh
        </button>
        {data?.ip && <CopyButton value={data.ip} />}
      </div>
      <TerminalCard label="your ip">
        {loading && !data ? (
          <span className="text-muted">looking up...</span>
        ) : data?.ip ? (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">ip</dt>
            <dd className="break-all">{data.ip}</dd>
            <dt className="text-muted">city</dt>
            <dd>
              {[data.city, data.region, data.country].filter(Boolean).join(", ") || "unknown"}
            </dd>
            <dt className="text-muted">coords</dt>
            <dd>
              {data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "unknown"}
            </dd>
            <dt className="text-muted">timezone</dt>
            <dd>{data.timezone ?? "unknown"}</dd>
          </dl>
        ) : (
          <span className="text-muted">
            could not determine your IP (running behind a proxy or on localhost)
          </span>
        )}
      </TerminalCard>
    </div>
  );
}
