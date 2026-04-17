"use client";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useTrackOnce } from "@/lib/analytics/useTrackOnce";
import { formatJson } from "@/lib/tools/json";
import { useState } from "react";

export function Json() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const result = formatJson(input, indent);

  useTrackOnce("json", input.length > 0, result.ok);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs items-center">
        <span className="text-muted">indent:</span>
        {[0, 2, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setIndent(n)}
            className={`border px-2 py-0.5 ${indent === n ? "border-accent text-accent" : ""}`}
          >
            {n === 0 ? "min" : n}
          </button>
        ))}
      </div>
      <label className="block text-xs text-muted">
        input
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <TerminalCard label="output">
        {result.ok ? (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">
              {result.value || <span className="text-muted">(empty)</span>}
            </pre>
            {result.value && <CopyButton value={result.value} />}
          </div>
        ) : (
          <span className="text-muted">error: {result.error}</span>
        )}
      </TerminalCard>
    </div>
  );
}
