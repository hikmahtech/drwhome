"use client";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useTrackOnce } from "@/lib/analytics/useTrackOnce";
import { decodeUrl, encodeUrl } from "@/lib/tools/url";
import { useState } from "react";

type Mode = "encode" | "decode";

export function UrlCodec() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output =
    mode === "encode" ? { ok: true as const, value: encodeUrl(input).value } : decodeUrl(input);

  useTrackOnce("url-codec", input.length > 0, output.ok);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`border px-2 py-0.5 ${mode === m ? "border-accent text-accent" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>
      <label className="block text-xs text-muted">
        input
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <TerminalCard label="output">
        {output.ok ? (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">
              {output.value || <span className="text-muted">(empty)</span>}
            </pre>
            {output.value && <CopyButton value={output.value} />}
          </div>
        ) : (
          <span className="text-muted">error: {output.error}</span>
        )}
      </TerminalCard>
    </div>
  );
}
