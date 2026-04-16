import { ThemeToggle } from "@/components/terminal/ThemeToggle";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-content mx-auto px-4 py-3 flex items-center justify-between border-b">
      <Link href="/" className="no-underline text-fg">
        drwho
        <span className="cursor" />
      </Link>
      <div className="flex items-center gap-4 text-xs">
        <Link href="/#tools">tools</Link>
        <Link href="/about">about</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
