export function RateLimitBanner({ domain, resetAt }: { domain: string; resetAt: Date }) {
  return (
    <div className="border rounded-sm p-3 text-sm">
      <p>
        <span className="text-accent">rate limit</span> — <code>{domain}</code>
      </p>
      <p className="text-muted mt-1">
        you have exceeded the per-hour dossier budget. budget resets at{" "}
        <time dateTime={resetAt.toISOString()}>{resetAt.toISOString()}</time>.
      </p>
    </div>
  );
}
