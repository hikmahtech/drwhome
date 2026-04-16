"use client";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { parseUserAgent } from "@/lib/tools/userAgent";
import { useEffect, useState } from "react";

export function UserAgent() {
  const [ua, setUa] = useState("");

  useEffect(() => {
    setUa(navigator.userAgent);
  }, []);

  const parsed = ua ? parseUserAgent(ua) : null;

  return (
    <div className="space-y-4">
      <label className="block text-xs text-muted">
        user agent
        <textarea
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          rows={3}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <div className="flex gap-2">{ua && <CopyButton value={ua} />}</div>
      {parsed && (
        <TerminalCard label="parsed">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">browser</dt>
            <dd>
              {parsed.browser.name ?? "?"} {parsed.browser.version ?? ""}
            </dd>
            <dt className="text-muted">engine</dt>
            <dd>
              {parsed.engine.name ?? "?"} {parsed.engine.version ?? ""}
            </dd>
            <dt className="text-muted">os</dt>
            <dd>
              {parsed.os.name ?? "?"} {parsed.os.version ?? ""}
            </dd>
            <dt className="text-muted">device</dt>
            <dd>
              {[parsed.device.vendor, parsed.device.model, parsed.device.type]
                .filter(Boolean)
                .join(" · ") || "desktop"}
            </dd>
          </dl>
        </TerminalCard>
      )}
    </div>
  );
}
