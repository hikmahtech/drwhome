"use client";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { type UuidVersion, generateUuid } from "@/lib/tools/uuid";
import { useState } from "react";

export function Uuid() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    setUuids(Array.from({ length: count }, () => generateUuid(version)));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs items-center flex-wrap">
        <span className="text-muted">version:</span>
        {(["v4", "v7"] as UuidVersion[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVersion(v)}
            className={`border px-2 py-0.5 ${version === v ? "border-accent text-accent" : ""}`}
          >
            {v}
          </button>
        ))}
        <span className="text-muted ml-4">count:</span>
        {[1, 5, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            className={`border px-2 py-0.5 ${count === n ? "border-accent text-accent" : ""}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={generate}
          className="border px-3 py-0.5 border-accent text-accent ml-auto"
        >
          generate
        </button>
      </div>
      <TerminalCard label="output">
        {uuids.length === 0 ? (
          <span className="text-muted">click generate.</span>
        ) : (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">{uuids.join("\n")}</pre>
            <CopyButton value={uuids.join("\n")} />
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
