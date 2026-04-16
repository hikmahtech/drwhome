import type { ReactNode } from "react";

type Props = { label?: string; children: ReactNode; className?: string };

export function TerminalCard({ label, children, className = "" }: Props) {
  return (
    <div className={`border ${className}`}>
      {label && (
        <div className="border-b px-3 py-1 text-xs text-muted">$ {label}</div>
      )}
      <div className="p-3 text-sm break-all">{children}</div>
    </div>
  );
}
