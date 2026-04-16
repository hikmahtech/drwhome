import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full max-w-content mx-auto px-4 py-6 mt-12 border-t text-xs text-muted">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/about">about</Link>
        <Link href="/blog">blog</Link>
        <Link href="/privacy">privacy</Link>
        <Link href="/terms">terms</Link>
        <Link href="/contact">contact</Link>
        <span className="ml-auto">
          © {new Date().getFullYear()}{" "}
          <a href="https://hikmahtechnologies.com" rel="noopener">
            hikmah technologies
          </a>
        </span>
      </div>
      <p className="mt-3">
        drwho.me contains affiliate links. See <Link href="/privacy#affiliates">disclosure</Link>.
      </p>
    </footer>
  );
}
