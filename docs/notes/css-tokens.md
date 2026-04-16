# CSS color tokens

Colors are stored as hex in `app/globals.css` CSS variables. This is intentional for legibility.

**Tradeoff:** Tailwind v4 opacity utilities like `bg-accent/50` require `oklch()` or space-separated channels to work. We don't use opacity utilities anywhere (the design system is flat: no shadows, no glassmorphism, hover states use border-color swaps, not opacity).

**If this ever changes** (e.g. adding translucent overlays), migrate the five tokens in `app/globals.css` — both the `:root` block and the `[data-theme="dark"]` / `@media` blocks — from hex to `oklch()` before adding any `bg-*/<N>` or `text-*/<N>` classes. Otherwise those classes will silently produce invalid CSS.
