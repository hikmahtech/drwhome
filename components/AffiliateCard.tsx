type Props = { label: string; href: string; title: string; description: string };

export function AffiliateCard({ label, href, title, description }: Props) {
  return (
    <aside className="border my-6 p-3 text-sm">
      <div className="text-xs text-muted mb-1">{label} · sponsor</div>
      <a href={href} rel="noreferrer nofollow sponsored noopener" target="_blank" className="block">
        <strong className="text-fg no-underline">{title}</strong>
        <span className="block text-muted text-xs mt-1">{description}</span>
      </a>
    </aside>
  );
}
