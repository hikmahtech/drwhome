"use client";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { decodeJwt } from "@/lib/tools/jwt";
import { useState } from "react";

export function Jwt() {
  const [input, setInput] = useState("");
  const result = input.trim() === "" ? null : decodeJwt(input);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        decoded client-side. this tool does not verify signatures.
      </p>
      <label className="block text-xs text-muted">
        token
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      {result?.ok && (
        <>
          <TerminalCard label="header">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(result.header, null, 2)}
            </pre>
          </TerminalCard>
          <TerminalCard label="payload">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </TerminalCard>
          <TerminalCard label="signature">
            <pre className="whitespace-pre-wrap break-all">{result.signature}</pre>
          </TerminalCard>
        </>
      )}
      {result && !result.ok && (
        <TerminalCard label="error">
          <span className="text-muted">{result.error}</span>
        </TerminalCard>
      )}
    </div>
  );
}
