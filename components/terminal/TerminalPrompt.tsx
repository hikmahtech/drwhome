import type { ReactNode } from "react";

export function TerminalPrompt({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag className={level === 1 ? "text-xl" : "text-lg"}>
      <span className="text-accent">&gt;</span> <span>{children}</span>
    </Tag>
  );
}
