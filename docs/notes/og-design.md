# OG image design notes

- Canvas: 1200×630.
- Background: `--bg` dark (#0a0a0a). OG previews are consumed on dark surfaces (Slack/Twitter), so the light theme is intentionally not used.
- Font: JetBrains Mono, bundled under `public/fonts/`, loaded as ArrayBuffer into `next/og`.
- Template: breadcrumb (top) · title + description (middle) · brand (bottom).
- Title colour: `--accent` green for tool pages; `--fg` for blog posts — blog titles are longer and need higher density.
- If `lib/og.ts` colours drift from `app/globals.css`, update both.
