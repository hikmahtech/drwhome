export function DenylistBanner({ domain, reason }: { domain: string; reason: string }) {
  return (
    <div className="border rounded-sm p-3 text-sm">
      <p>
        <span className="text-accent">denylist</span> — <code>{domain}</code>
      </p>
      <p className="text-muted mt-1">{reason}</p>
    </div>
  );
}
