# Evidence Pack Companion Implementation Plan (drwho-side)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the drwho-side surfaces of the Evidence Pack product: extract `lib/dossier/checks/*` as `@drwhome/dossier-checks` (publishable npm package via pnpm workspace), build the `/evidence-pack` marketing landing with live 3-check mini-summary, wire upsell CTAs into `/d/<domain>` + `/tools` + home, ship analytics events, and prove the work with green Vitest + Playwright + Lighthouse runs.

**Architecture:** A pnpm workspace makes `lib/dossier/checks/*` (plus `types.ts`, `ids.ts`, `validate-domain.ts`) the source of `packages/dossier-checks/`. The Next.js app consumes the package via `workspace:*`. The `/evidence-pack` page is a Next.js 15 RSC reusing those checks at runtime (no client fetches). Upsell links are client components that fire analytics and outbound to `https://app.drwho.me/buy?domain=…`.

**Tech Stack:** Next.js 15 App Router · TypeScript strict · Tailwind v4 · pnpm workspace · Vitest · Playwright · Lighthouse CI · Biome.

**Companion design spec:** `docs/superpowers/specs/2026-04-25-evidence-pack-companion-design.md` (this branch).

**Master spec (out of scope for this plan):** `hikmahtech/app-drwho` — `docs/superpowers/specs/2026-04-25-evidence-pack-design.md`.

---

## Phase 0 — Branch + working state

This plan is authored on the existing worktree branch `worktree-evidence-pack-companion-spec` (PR [#11](https://github.com/hikmahtech/drwhome/pull/11)). Implementation continues on the same branch — the plan ships in the same PR as the spec, then implementation work follows in subsequent commits.

Active path: `/Users/arshad/Workspace/hikmah/drwho/.claude/worktrees/evidence-pack-companion-spec/`

---

## Phase 1 — Extract `@drwhome/dossier-checks` workspace package

**Files (high-level):**
- Create: `pnpm-workspace.yaml`
- Create: `packages/dossier-checks/package.json`
- Create: `packages/dossier-checks/tsconfig.json`
- Create: `packages/dossier-checks/tsup.config.ts`
- Create: `packages/dossier-checks/README.md`
- Create: `packages/dossier-checks/LICENSE` (MIT, mirrors root)
- Create: `packages/dossier-checks/src/index.ts`
- Move: `lib/dossier/checks/*.ts` → `packages/dossier-checks/src/checks/*.ts`
- Move: `lib/dossier/{types,ids,validate-domain}.ts` → `packages/dossier-checks/src/*.ts`
- Modify: root `package.json` (workspace dep)
- Modify: root `tsconfig.json` (path alias mapping)
- Modify: ~25 `*.ts`/`*.tsx` files swapping import specifiers

### Task 1.1: Create `pnpm-workspace.yaml`

**Files:**
- Create: `pnpm-workspace.yaml`

- [ ] **Step 1: Write the workspace manifest**

```yaml
packages:
  - .
  - "packages/*"
```

- [ ] **Step 2: Commit (no other changes yet)**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: add pnpm-workspace.yaml"
```

### Task 1.2: Create `packages/dossier-checks/` skeleton

**Files:**
- Create: `packages/dossier-checks/package.json`
- Create: `packages/dossier-checks/tsconfig.json`
- Create: `packages/dossier-checks/tsup.config.ts`
- Create: `packages/dossier-checks/README.md`
- Create: `packages/dossier-checks/LICENSE`

- [ ] **Step 1: `packages/dossier-checks/package.json`**

```json
{
  "name": "@drwhome/dossier-checks",
  "version": "0.1.0",
  "description": "Pure check fns powering the drwho.me Domain Dossier (DNS, MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface).",
  "license": "MIT",
  "author": "Hikmah Technologies <arshad@hikmahtechnologies.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hikmahtech/drwhome.git",
    "directory": "packages/dossier-checks"
  },
  "homepage": "https://drwho.me/domain-dossier",
  "keywords": ["dns", "dmarc", "spf", "dkim", "tls", "domain", "dossier", "drwho"],
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "pnpm build"
  },
  "publishConfig": {
    "access": "public"
  },
  "devDependencies": {
    "tsup": "^8.3.0",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: `packages/dossier-checks/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "noEmit": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: `packages/dossier-checks/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
```

- [ ] **Step 4: `packages/dossier-checks/README.md`**

```markdown
# @drwhome/dossier-checks

Pure-function domain check library powering the [drwho.me Domain Dossier](https://drwho.me/domain-dossier).

## Checks

| Check | What it does |
|---|---|
| `dnsCheck(domain)` | A, AAAA, NS, SOA, CAA, TXT records via Cloudflare DoH |
| `mxCheck(domain)` | MX records sorted by priority |
| `spfCheck(domain)` | SPF TXT record |
| `dmarcCheck(domain)` | DMARC TXT at `_dmarc.<domain>` |
| `dkimCheck(domain)` | Probes common DKIM selectors |
| `tlsCheck(domain)` | Cert subject, issuer, SANs, expiry |
| `redirectsCheck(domain)` | HTTP redirect chain (≤10 hops) |
| `headersCheck(domain)` | HTTP security headers |
| `corsCheck(domain)` | OPTIONS preflight + Access-Control-* |
| `webSurfaceCheck(domain)` | robots.txt, sitemap.xml, home `<head>` |

## Result type

All checks return `Promise<CheckResult<T>>`:

```ts
type CheckResult<T> =
  | { status: "ok"; data: T; fetchedAt: string }
  | { status: "timeout"; ms: number }
  | { status: "not_applicable"; reason: string }
  | { status: "error"; message: string };
```

## License

MIT.
```

- [ ] **Step 5: `packages/dossier-checks/LICENSE`**

Copy the existing root `LICENSE` file verbatim:

```bash
cp LICENSE packages/dossier-checks/LICENSE
```

- [ ] **Step 6: Commit**

```bash
git add packages/dossier-checks
git commit -m "chore(dossier-checks): scaffold workspace package skeleton"
```

### Task 1.3: Move source files into the package

**Files:**
- Move: `lib/dossier/checks/cors.ts` → `packages/dossier-checks/src/checks/cors.ts`
- Move: `lib/dossier/checks/dkim.ts` → `packages/dossier-checks/src/checks/dkim.ts`
- Move: `lib/dossier/checks/dmarc.ts` → `packages/dossier-checks/src/checks/dmarc.ts`
- Move: `lib/dossier/checks/dns.ts` → `packages/dossier-checks/src/checks/dns.ts`
- Move: `lib/dossier/checks/headers.ts` → `packages/dossier-checks/src/checks/headers.ts`
- Move: `lib/dossier/checks/mx.ts` → `packages/dossier-checks/src/checks/mx.ts`
- Move: `lib/dossier/checks/redirects.ts` → `packages/dossier-checks/src/checks/redirects.ts`
- Move: `lib/dossier/checks/spf.ts` → `packages/dossier-checks/src/checks/spf.ts`
- Move: `lib/dossier/checks/tls.ts` → `packages/dossier-checks/src/checks/tls.ts`
- Move: `lib/dossier/checks/web-surface.ts` → `packages/dossier-checks/src/checks/web-surface.ts`
- Move: `lib/dossier/checks/_doh.ts` → `packages/dossier-checks/src/checks/_doh.ts`
- Move: `lib/dossier/types.ts` → `packages/dossier-checks/src/types.ts`
- Move: `lib/dossier/ids.ts` → `packages/dossier-checks/src/ids.ts`
- Move: `lib/dossier/validate-domain.ts` → `packages/dossier-checks/src/validate-domain.ts`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p packages/dossier-checks/src/checks
```

- [ ] **Step 2: Move files using `git mv` so history is preserved**

```bash
git mv lib/dossier/checks/cors.ts        packages/dossier-checks/src/checks/cors.ts
git mv lib/dossier/checks/dkim.ts        packages/dossier-checks/src/checks/dkim.ts
git mv lib/dossier/checks/dmarc.ts       packages/dossier-checks/src/checks/dmarc.ts
git mv lib/dossier/checks/dns.ts         packages/dossier-checks/src/checks/dns.ts
git mv lib/dossier/checks/headers.ts     packages/dossier-checks/src/checks/headers.ts
git mv lib/dossier/checks/mx.ts          packages/dossier-checks/src/checks/mx.ts
git mv lib/dossier/checks/redirects.ts   packages/dossier-checks/src/checks/redirects.ts
git mv lib/dossier/checks/spf.ts         packages/dossier-checks/src/checks/spf.ts
git mv lib/dossier/checks/tls.ts         packages/dossier-checks/src/checks/tls.ts
git mv lib/dossier/checks/web-surface.ts packages/dossier-checks/src/checks/web-surface.ts
git mv lib/dossier/checks/_doh.ts        packages/dossier-checks/src/checks/_doh.ts
git mv lib/dossier/types.ts              packages/dossier-checks/src/types.ts
git mv lib/dossier/ids.ts                packages/dossier-checks/src/ids.ts
git mv lib/dossier/validate-domain.ts    packages/dossier-checks/src/validate-domain.ts
rmdir lib/dossier/checks
```

- [ ] **Step 3: Update intra-package import paths**

Inside `packages/dossier-checks/src/**/*.ts`, change every `from "@/lib/dossier/...` import to a relative path. Use this command:

```bash
find packages/dossier-checks/src -name '*.ts' -print0 | xargs -0 sed -i '' \
  -e 's|@/lib/dossier/checks/_doh|./_doh|g' \
  -e 's|@/lib/dossier/types|../types|g' \
  -e 's|@/lib/dossier/ids|../ids|g' \
  -e 's|@/lib/dossier/validate-domain|../validate-domain|g'
```

For files in `packages/dossier-checks/src/` (not in `checks/`), the relative paths are different:

```bash
sed -i '' -e 's|\.\./types|./types|g' -e 's|\.\./ids|./ids|g' -e 's|\.\./validate-domain|./validate-domain|g' \
  packages/dossier-checks/src/types.ts \
  packages/dossier-checks/src/ids.ts \
  packages/dossier-checks/src/validate-domain.ts
```

(BSD `sed` requires `-i ''`. On Linux drop the `''`.)

- [ ] **Step 4: Verify no `@/` imports remain inside the package**

```bash
grep -rn "from \"@/" packages/dossier-checks/src/ || echo "clean"
```

Expected output: `clean`. If any line prints, hand-fix the import.

### Task 1.4: Write the package barrel `src/index.ts`

**Files:**
- Create: `packages/dossier-checks/src/index.ts`

- [ ] **Step 1: Author the barrel**

```ts
// Pure check functions
export { dnsCheck, DNS_DOSSIER_TYPES } from "./checks/dns";
export type { DnsAnswer, DnsCheckData, DnsDossierType } from "./checks/dns";

export { mxCheck } from "./checks/mx";
export type { MxCheckData } from "./checks/mx";

export { spfCheck } from "./checks/spf";
export type { SpfCheckData } from "./checks/spf";

export { dmarcCheck } from "./checks/dmarc";
export type { DmarcCheckData } from "./checks/dmarc";

export { dkimCheck } from "./checks/dkim";
export type { DkimCheckData } from "./checks/dkim";

export { tlsCheck } from "./checks/tls";
export type { TlsCheckData } from "./checks/tls";

export { redirectsCheck } from "./checks/redirects";
export type { RedirectsCheckData } from "./checks/redirects";

export { headersCheck } from "./checks/headers";
export type { HeadersCheckData } from "./checks/headers";

export { corsCheck } from "./checks/cors";
export type { CorsCheckData } from "./checks/cors";

export { webSurfaceCheck } from "./checks/web-surface";
export type { WebSurfaceCheckData } from "./checks/web-surface";

// Shared infrastructure
export type { CheckResult } from "./types";
export { isOk, isError } from "./types";
export { dossierCheckIds } from "./ids";
export type { DossierCheckId } from "./ids";
export { validateDomain } from "./validate-domain";
```

> **Verify before committing:** open each `packages/dossier-checks/src/checks/*.ts` and confirm the `*CheckData` type names exported match what is in this barrel. If a file calls its data type `MxData` instead of `MxCheckData`, update the barrel to match the source — do not rename existing exports.

- [ ] **Step 2: Type-check the package in isolation**

```bash
cd packages/dossier-checks && pnpm exec tsc --noEmit
```

Expected: no errors.

```bash
cd ../..
```

### Task 1.5: Update root `package.json` to consume the workspace package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the workspace dep + a build-package script**

In root `package.json`, add inside `"dependencies"`:

```json
"@drwhome/dossier-checks": "workspace:*"
```

…and inside `"scripts"`, add:

```json
"build:packages": "pnpm -F @drwhome/dossier-checks build"
```

- [ ] **Step 2: Run `pnpm install` to wire workspace symlinks**

```bash
pnpm install
```

Expected: prints `Done in <Xs>` and creates a `node_modules/@drwhome/dossier-checks` symlink to `packages/dossier-checks`.

```bash
ls -la node_modules/@drwhome/dossier-checks
```

Expected: shows it as a symlink to `../../packages/dossier-checks`.

### Task 1.6: Update root `tsconfig.json` to resolve the package against source

For developer-experience speed and to avoid an explicit pre-build, point TS at the package source rather than its built output. Next.js bundling resolves the `exports` map at runtime (built output), but during typecheck and dev we want hot-reloading off source.

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Add a path alias**

In `compilerOptions.paths`, add:

```json
"@drwhome/dossier-checks": ["./packages/dossier-checks/src/index.ts"]
```

The full block becomes:

```json
"paths": {
  "@/*": ["./*"],
  "@drwhome/dossier-checks": ["./packages/dossier-checks/src/index.ts"]
}
```

> **Why source not built:** with the path-alias to `src`, `tsc --noEmit` (the existing `pnpm typecheck`) and Next.js dev both resolve straight to TS source, so we never need to remember to rebuild the package after editing it. The built `dist/` is only consumed by external consumers (app-drwho) once published.

### Task 1.7: Codemod app-side imports

The check files moved out of `lib/dossier/checks/`. Every import that used `@/lib/dossier/checks/<name>` or `@/lib/dossier/{types,ids,validate-domain}` must point at `@drwhome/dossier-checks`.

**Files:**
- Modify: ~50 files across `app/`, `components/`, `lib/`, `tests/`

- [ ] **Step 1: Find all consumers**

```bash
grep -rln "@/lib/dossier/\(checks\|types\|ids\|validate-domain\)" \
  --include='*.ts' --include='*.tsx' \
  app components lib tests
```

Save the list — every file in the output gets an import rewrite.

- [ ] **Step 2: Rewrite imports — checks**

Each `import { fooCheck } from "@/lib/dossier/checks/foo"` becomes
`import { fooCheck } from "@drwhome/dossier-checks"`.

```bash
find app components lib tests -name '*.ts' -o -name '*.tsx' | \
  xargs sed -i '' -E '
    s|from "@/lib/dossier/checks/[a-z_-]+"|from "@drwhome/dossier-checks"|g;
    s|from "@/lib/dossier/types"|from "@drwhome/dossier-checks"|g;
    s|from "@/lib/dossier/ids"|from "@drwhome/dossier-checks"|g;
    s|from "@/lib/dossier/validate-domain"|from "@drwhome/dossier-checks"|g;
  '
```

> **Important caveat:** the line above merges multiple imports into one specifier per line. If a file ends up with two `import … from "@drwhome/dossier-checks"` lines, dedupe them by hand. Run:
>
> ```bash
> grep -rn "from \"@drwhome/dossier-checks\"" app components lib tests | sort | uniq -c | sort -rn | head
> ```
>
> Files showing > 1 line per file need manual dedup.

- [ ] **Step 3: Files in `packages/dossier-checks/src/` are exempt**

The codemod targeted `app components lib tests` only, but double-check no `@/` import survived:

```bash
grep -rn "@/lib/dossier/\(checks\|types\|ids\|validate-domain\)" \
  --include='*.ts' --include='*.tsx' \
  app components lib tests || echo "clean"
```

Expected: `clean`.

### Task 1.8: Verify typecheck

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: **0 errors**. Common failures + remedies:
- `Cannot find module '@drwhome/dossier-checks'`: tsconfig path alias missing — Task 1.6.
- `Module … has no exported member 'XCheckData'`: barrel export name mismatch — Task 1.4 step 1's verify note.
- `Cannot find name 'CheckResult'`: a file imports `CheckResult` from `@/lib/dossier/types` — codemod missed it; rerun Task 1.7 step 2.

### Task 1.9: Verify Vitest unit tests

- [ ] **Step 1: Run unit tests**

```bash
pnpm test
```

Expected: all unit tests pass. The test files under `tests/unit/lib/dossier/{checks,validate-domain,types}*` were rewritten by the codemod and now import from the package; their assertions are unchanged.

> If any unit test imported a *path* like `@/lib/dossier/checks/_doh` to mock `dohFetch`, the codemod will have changed it to `@drwhome/dossier-checks` — but `_doh.ts` is **not** in the barrel (it's an internal). For those tests, change the mock target to `@drwhome/dossier-checks` and mock the public exports the test consumes (`dnsCheck`, `mxCheck`, etc.). If a unit test specifically targets `dohFetch`, expose it from the barrel as `__dohFetch` for the test or move the test inside the package at `packages/dossier-checks/test/`.

### Task 1.10: Verify Playwright E2E

- [ ] **Step 1: Run E2E tests**

```bash
pnpm test:e2e
```

Expected: all E2E tests pass (`tests/e2e/dossier.spec.ts`, `mcp.spec.ts`, `seo.spec.ts`, `smoke.spec.ts`).

### Task 1.11: Verify Lighthouse CI gate

- [ ] **Step 1: Run Lighthouse CI**

```bash
pnpm lh
```

Expected: Performance and SEO categories ≥ 0.95 across all 7 URLs in `.lighthouserc.json`. If perf drops below 0.95 on `/d/example.com`, profile to confirm the regression isn't from the package — first build of the workspace package may include source maps that ship to the client. Verify `.next/server/` doesn't carry `.map` files into prod by checking `next.config.ts` `productionBrowserSourceMaps` (default false).

### Task 1.12: Commit Phase 1

- [ ] **Step 1: Commit the moved files + import rewrites**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(dossier): extract checks into @drwhome/dossier-checks workspace package

Moves lib/dossier/{checks/*,types,ids,validate-domain}.ts into a new
pnpm workspace package at packages/dossier-checks. The package is the
sole source of pure check fns; lib/dossier/{cache,registry,denylist,...}
remain app-side wrappers that import from the package.

This unblocks the sibling app-drwho repo from consuming the same check
code without duplication. Existing dossier UI, MCP server, and tests
all import via the new specifier without behaviour change.
EOF
)"
```

---

## Phase 2 — `/evidence-pack` landing scaffold (no live mini-summary yet)

**Files:**
- Create: `app/evidence-pack/page.tsx`
- Create: `app/evidence-pack/EvidencePackInput.tsx` (client)
- Create: `app/evidence-pack/PricingCard.tsx`
- Create: `public/sample-evidence-pack.pdf` (placeholder; real redacted version lands later as part of app-drwho work)
- Create: `lib/evidence-pack/constants.ts`

The landing renders without a mini-summary in this phase. Phase 3 adds the live 3-check section.

### Task 2.1: Add the placeholder sample PDF

The hero links to `/sample-evidence-pack.pdf`. We ship a 1-page placeholder for now; once the real Evidence Pack is built in `app-drwho`, the placeholder is replaced with a redacted real artefact.

- [ ] **Step 1: Render a one-page PDF placeholder via Playwright**

We already depend on Playwright (`@playwright/test`); use its built-in `page.pdf()` to render a static HTML to a real one-page PDF. Run from the repo root:

```bash
mkdir -p public
node --input-type=module -e "
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const html = \`<!doctype html><html><head><title>Evidence Pack — sample</title>
<style>body{font-family:monospace;padding:40px;max-width:680px;font-size:14px}
h1{font-size:18px;margin-bottom:1em}p{margin:1em 0;line-height:1.5}</style>
</head><body>
<h1>drwho.me — Evidence Pack (sample)</h1>
<p>This is a placeholder sample. A redacted real report ships once the Evidence
Pack launches at app.drwho.me. The real PDF includes a branded cover,
executive summary, per-check findings with severity grading, framework mapping
appendix (DPDP 2023 · ISO 27001:2022 · SOC 2 TSC), and a manifest appendix with
SHA-256 hashes + Ed25519 signature for tamper verification.</p>
<p>For now, see the free 10-check Domain Dossier at
https://drwho.me/d/example.com.</p>
</body></html>\`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
const buf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } });
writeFileSync('public/sample-evidence-pack.pdf', buf);
await browser.close();
"
```

If `playwright` isn't installed yet, run `pnpm exec playwright install chromium` first.

- [ ] **Step 2: Verify the file is a real PDF**

```bash
file public/sample-evidence-pack.pdf
```

Expected: `public/sample-evidence-pack.pdf: PDF document, version 1.4`.

- [ ] **Step 3: Commit**

```bash
git add public/sample-evidence-pack.pdf
git commit -m "feat(evidence-pack): add placeholder sample PDF"
```

### Task 2.2: Create `lib/evidence-pack/constants.ts`

**Files:**
- Create: `lib/evidence-pack/constants.ts`

Single source of truth for the price + buy URL. Phase-1 hardcoded; revisited if/when app-drwho exposes a `/api/pricing` endpoint we can SSR-fetch.

- [ ] **Step 1: Author the file**

```ts
// Source of truth for the public marketing landing. Mirrors the price
// configured in app-drwho. Bump this constant + redeploy when changing.
export const EVIDENCE_PACK_PRICE_INR = 7500;
export const EVIDENCE_PACK_BUY_URL = "https://app.drwho.me/buy";

export function buildBuyUrl(domain?: string): string {
  if (!domain) return EVIDENCE_PACK_BUY_URL;
  const u = new URL(EVIDENCE_PACK_BUY_URL);
  u.searchParams.set("domain", domain);
  return u.toString();
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

### Task 2.3: Create `app/evidence-pack/EvidencePackInput.tsx` (client)

Mirrors the existing `app/domain-dossier/DomainInput.tsx` pattern but submits to `/evidence-pack?domain=…` (same page) so the mini-summary renders inline in Phase 3.

**Files:**
- Create: `app/evidence-pack/EvidencePackInput.tsx`

- [ ] **Step 1: Author**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EvidencePackInput({ initial }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = value.trim().toLowerCase();
    if (!d) return;
    router.push(`/evidence-pack?domain=${encodeURIComponent(d)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="example.com"
        className="flex-1 bg-transparent border px-3 py-2 text-sm font-mono outline-none focus:border-accent"
        aria-label="domain"
      />
      <button type="submit" className="border px-4 py-2 text-sm hover:border-accent">
        check →
      </button>
    </form>
  );
}
```

### Task 2.4: Create `app/evidence-pack/PricingCard.tsx`

Server component (no interactivity beyond a Link). The actual outbound "Buy" button is a client component (next task) so it can fire analytics. Pricing card is purely presentational.

**Files:**
- Create: `app/evidence-pack/PricingCard.tsx`
- Create: `app/evidence-pack/BuyButton.tsx` (client)

- [ ] **Step 1: `PricingCard.tsx`**

```tsx
import { EVIDENCE_PACK_PRICE_INR } from "@/lib/evidence-pack/constants";
import { BuyButton } from "./BuyButton";

export function PricingCard({ domain }: { domain?: string }) {
  return (
    <section className="border p-4 space-y-3">
      <h2 className="text-sm text-muted">pricing</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl">₹{EVIDENCE_PACK_PRICE_INR.toLocaleString("en-IN")}</span>
        <span className="text-sm text-muted">per domain · one-time</span>
      </div>
      <ul className="text-sm text-muted space-y-1 list-disc list-inside">
        <li>15 checks (DNS, email auth, TLS, MTA-STS, TLSRPT, DNSSEC, WHOIS, CT-log subdomains, ...)</li>
        <li>Severity-graded findings + remediation</li>
        <li>Framework mapping: DPDP 2023 · ISO 27001:2022 · SOC 2 TSC</li>
        <li>Questionnaire snippets (paste-ready)</li>
        <li>Signed evidence ZIP + Ed25519 manifest</li>
        <li>GST invoice (B2B input-credit eligible)</li>
        <li>Razorpay (INR), PayPal (international)</li>
        <li>Refund if any check errors after retries</li>
      </ul>
      <BuyButton domain={domain} />
    </section>
  );
}
```

- [ ] **Step 2: `BuyButton.tsx`**

```tsx
"use client";

import { trackEvidencePackBuyClick } from "@/lib/analytics/client";
import { buildBuyUrl } from "@/lib/evidence-pack/constants";

export function BuyButton({ domain }: { domain?: string }) {
  return (
    <a
      href={buildBuyUrl(domain)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvidencePackBuyClick(domain ?? "")}
      className="inline-block border px-4 py-2 text-sm hover:border-accent"
    >
      buy evidence pack →
    </a>
  );
}
```

> `trackEvidencePackBuyClick` doesn't exist yet — added in Phase 4. Until then, typecheck will fail. Land Phase 4 *before* this task in your execution order if running the plan top-to-bottom strictly (or proceed and let typecheck fail until Phase 4). Recommended order: 4 → 2.4. Note this in the PR description if executing out of order.

### Task 2.5: Create `app/evidence-pack/page.tsx`

**Files:**
- Create: `app/evidence-pack/page.tsx`

- [ ] **Step 1: Author the page**

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { EVIDENCE_PACK_PRICE_INR } from "@/lib/evidence-pack/constants";
import { buildFaqJsonLd, buildSoftwareApplicationJsonLd, pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EvidencePackInput } from "./EvidencePackInput";
import { PricingCard } from "./PricingCard";

export const metadata: Metadata = pageMetadata({
  title: "evidence pack — automated domain security report — drwho.me",
  description:
    `automated, evidence-grade domain security audit for indian b2b compliance. 15 checks, severity-graded findings, dpdp + iso 27001 + soc 2 framework mapping, signed evidence zip + pdf. ₹${EVIDENCE_PACK_PRICE_INR.toLocaleString("en-IN")} per domain.`,
  path: "/evidence-pack",
  type: "page",
});

const FAQ = [
  {
    q: "What's the difference between the free dossier and the Evidence Pack?",
    a: "The free dossier shows 10 of 15 checks as a snapshot. The Evidence Pack adds 5 more checks (MTA-STS, TLSRPT, DNSSEC, WHOIS/age, CT-log subdomains), expands the TLS check to a full protocol/cipher audit, severity-grades every finding, maps each finding to DPDP / ISO 27001 / SOC 2 controls, generates a signed evidence ZIP + branded PDF, and ships paste-ready questionnaire snippets — everything an auditor would ask for.",
  },
  {
    q: "How fast is delivery?",
    a: "10–30 minutes per domain. You'll get an email with download links plus a portal at app.drwho.me where you can re-download for 90 days.",
  },
  {
    q: "Do you provide GST invoices?",
    a: "Yes. Indian B2B buyers can enter a GSTIN at checkout to receive a tax-compliant invoice. Hikmah Technologies is GST-registered.",
  },
  {
    q: "What about international payments?",
    a: "Razorpay is the primary checkout for INR. International buyers can pay in USD via PayPal at the equivalent price.",
  },
  {
    q: "Is the underlying check library auditable?",
    a: "Yes. The check library is published as the open-source @drwhome/dossier-checks npm package (MIT). Anyone can audit exactly what we scan.",
  },
  {
    q: "What if a check fails?",
    a: "If any of the 15 checks errors out after retries, the order is automatically refunded in full and you're emailed about it. No partial deliveries.",
  },
];

export default async function EvidencePackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const domainParam = typeof sp.domain === "string" ? sp.domain.trim().toLowerCase() : undefined;

  const url = siteUrl();
  const app = buildSoftwareApplicationJsonLd({
    name: "drwho.me Evidence Pack",
    description:
      "automated evidence-grade domain security report for indian b2b compliance — 15 checks, dpdp + iso 27001 + soc 2 mapping, signed pdf + zip.",
    path: "/evidence-pack",
    siteUrl: url,
  });
  const faqJson = buildFaqJsonLd(FAQ);

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/evidence-pack" />
      <TerminalPrompt>evidence pack</TerminalPrompt>

      <section className="space-y-3">
        <h1 className="text-lg">automated domain security evidence — in 30 minutes</h1>
        <p className="text-sm text-muted">
          run 15 externally-observable checks on your domain. get a signed PDF report, raw
          evidence ZIP, and paste-ready questionnaire snippets mapped to DPDP / ISO 27001 / SOC 2
          controls. designed for indian b2b compliance prep — auditor-ready, no manual work.
        </p>
        <EvidencePackInput initial={domainParam} />
      </section>

      {/* Phase 3 wires <MiniSummary domain={domainParam}/> here when domainParam is set. */}

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">what's in the pack</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>10 free-tier checks (DNS, MX, SPF, DMARC, DKIM, TLS, redirects, headers, CORS, web-surface)</li>
          <li>5 paid-tier checks (MTA-STS, TLSRPT, DNSSEC, WHOIS / domain-age, CT-log subdomain inventory)</li>
          <li>expanded TLS audit (protocol + cipher matrix)</li>
          <li>severity-graded findings (info / low / medium / high / critical)</li>
          <li>framework mapping appendix (DPDP 2023, ISO 27001:2022, SOC 2 TSC)</li>
          <li>questionnaire snippet library (JSON + Markdown)</li>
          <li>Ed25519-signed manifest (verify the pack hasn't been tampered with)</li>
          <li>GST invoice for indian buyers (B2B input-credit eligible)</li>
        </ul>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">sample report</h2>
        <p className="text-sm text-muted">
          see a redacted sample of what you'll receive:{" "}
          <a href="/sample-evidence-pack.pdf" className="text-accent underline">
            sample-evidence-pack.pdf
          </a>
          .
        </p>
      </section>

      <PricingCard domain={domainParam} />

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">faq</h2>
        <div className="space-y-3">
          {FAQ.map((entry) => (
            <div key={entry.q} className="space-y-1">
              <h3 className="text-sm">{entry.q}</h3>
              <p className="text-sm text-muted">{entry.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="text-sm text-muted">read more</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <Link href={"/domain-dossier" as Route}>the free 10-check domain dossier</Link>
          </li>
          <li>
            <Link href={"/blog/email-deliverability-checklist" as Route}>
              email deliverability checklist
            </Link>
          </li>
          <li>
            <Link href={"/blog/security-headers-guide" as Route}>
              security headers every site should have in 2026
            </Link>
          </li>
        </ul>
      </section>

      <JsonLd data={app} />
      <JsonLd data={faqJson} />
    </article>
  );
}
```

- [ ] **Step 2: Verify the page renders in dev**

```bash
pnpm dev
```

Then in another shell:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/evidence-pack
```

Expected: `200`.

```bash
curl -s http://localhost:3000/evidence-pack | grep -o 'evidence pack' | head -3
```

Expected: matches present.

Stop dev server (`Ctrl+C`).

### Task 2.6: Commit Phase 2 (excluding BuyButton.tsx until Phase 4 lands)

Phase 4 must land before this commit if you executed in order. Otherwise, group-commit Phase 2 + 4 together.

- [ ] **Step 1: Verify typecheck still green**

```bash
pnpm typecheck
```

Expected: 0 errors. (Requires `trackEvidencePackBuyClick` to exist — see Phase 4.)

- [ ] **Step 2: Commit**

```bash
git add app/evidence-pack lib/evidence-pack
git commit -m "feat(evidence-pack): add /evidence-pack landing page"
```

---

## Phase 3 — Live mini-summary on `/evidence-pack?domain=…`

**Files:**
- Create: `components/evidence-pack/MiniSummary.tsx`
- Create: `components/evidence-pack/MiniSummarySection.tsx`
- Modify: `app/evidence-pack/page.tsx`

The mini-summary runs 3 of the 15 checks (DNS, DMARC, TLS) using the *cached* dossier registry so the mini-summary inherits all the existing rate-limit + cache infrastructure. Each check streams in via Suspense, mirroring `/d/[domain]` exactly.

### Task 3.1: Create `components/evidence-pack/MiniSummary.tsx`

The container that drives the streamed sub-sections.

**Files:**
- Create: `components/evidence-pack/MiniSummary.tsx`

- [ ] **Step 1: Author**

```tsx
import { Suspense } from "react";
import { MiniSummarySection } from "./MiniSummarySection";

export function MiniSummary({ domain }: { domain: string }) {
  return (
    <section className="space-y-3 border-t pt-4">
      <h2 className="text-sm text-muted">live preview — 3 of 15 checks</h2>
      <p className="text-sm text-muted">
        a quick sample of what the full pack contains. the paid pack adds 12 more checks,
        severity grading, framework mapping, and a signed evidence zip + pdf.
      </p>
      <Suspense fallback={<MiniSummarySkeleton title="dns" />}>
        <MiniSummarySection domain={domain} checkId="dns" />
      </Suspense>
      <Suspense fallback={<MiniSummarySkeleton title="dmarc" />}>
        <MiniSummarySection domain={domain} checkId="dmarc" />
      </Suspense>
      <Suspense fallback={<MiniSummarySkeleton title="tls" />}>
        <MiniSummarySection domain={domain} checkId="tls" />
      </Suspense>
    </section>
  );
}

function MiniSummarySkeleton({ title }: { title: string }) {
  return (
    <div className="border p-3 space-y-2">
      <div className="text-sm">{title}</div>
      <div className="text-xs text-muted">running…</div>
    </div>
  );
}
```

### Task 3.2: Create `components/evidence-pack/MiniSummarySection.tsx`

The async server component that runs one check and renders a one-line summary.

**Files:**
- Create: `components/evidence-pack/MiniSummarySection.tsx`

- [ ] **Step 1: Author**

```tsx
import { findCheck } from "@/lib/dossier/registry";
import { isError, isOk, type DossierCheckId } from "@drwhome/dossier-checks";

export async function MiniSummarySection({
  domain,
  checkId,
}: {
  domain: string;
  checkId: DossierCheckId;
}) {
  const check = findCheck(checkId);
  if (!check) return null;
  const result = await check.run(domain);

  return (
    <div className="border p-3 space-y-1">
      <div className="text-sm flex items-baseline justify-between gap-2">
        <span>{check.title}</span>
        <span className="text-xs text-muted">{result.status}</span>
      </div>
      <p className="text-xs text-muted">
        {isOk(result) ? summarise(checkId, result.data) : isError(result) ? result.message : "—"}
      </p>
    </div>
  );
}

function summarise(checkId: DossierCheckId, data: unknown): string {
  // Defensive narrowing — the per-check Data shape varies. Keep the message tight.
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (checkId === "dns") {
      const recs = o.records as Record<string, unknown[]> | undefined;
      const total = recs ? Object.values(recs).reduce((a, b) => a + b.length, 0) : 0;
      return `${total} dns records returned`;
    }
    if (checkId === "dmarc") {
      const txt = o.record as string | undefined;
      return txt ? txt.slice(0, 100) : "no _dmarc TXT";
    }
    if (checkId === "tls") {
      const expires = o.notAfter as string | undefined;
      const issuer = o.issuerCommonName as string | undefined;
      return `${issuer ?? "?"} · expires ${expires ?? "?"}`;
    }
  }
  return "ok";
}
```

> **Caveat:** the property names in `summarise` (`records`, `record`, `notAfter`, `issuerCommonName`) must match the actual `*CheckData` types in the package. Open `packages/dossier-checks/src/checks/{dns,dmarc,tls}.ts` and verify before committing. Adjust the field names to whatever the source uses; do **not** alter the source to fit this summariser.

### Task 3.3: Wire `<MiniSummary>` into the page

**Files:**
- Modify: `app/evidence-pack/page.tsx`

- [ ] **Step 1: Add import + usage**

In `app/evidence-pack/page.tsx`, add at the top:

```tsx
import { MiniSummary } from "@/components/evidence-pack/MiniSummary";
import { validateDomain } from "@drwhome/dossier-checks";
```

Replace the placeholder comment block:

```tsx
{/* Phase 3 wires <MiniSummary domain={domainParam}/> here when domainParam is set. */}
```

…with:

```tsx
{(() => {
  if (!domainParam) return null;
  const v = validateDomain(domainParam);
  if (!v.ok) return null;
  return <MiniSummary domain={v.domain} />;
})()}
```

### Task 3.4: Verify locally

- [ ] **Step 1: Run dev + hit the URL with a query**

```bash
pnpm dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/evidence-pack?domain=example.com"
```

Expected: `200`.

```bash
curl -s "http://localhost:3000/evidence-pack?domain=example.com" | grep -i "live preview" -A 2 | head
```

Expected: includes `live preview — 3 of 15 checks`.

Stop dev server.

### Task 3.5: Commit Phase 3

- [ ] **Step 1: Commit**

```bash
git add components/evidence-pack app/evidence-pack/page.tsx
git commit -m "feat(evidence-pack): live 3-check mini-summary on /evidence-pack?domain=..."
```

---

## Phase 4 — Analytics events

**Files:**
- Modify: `lib/analytics/client.ts`
- Create/Modify: `tests/unit/lib/analytics/client.test.ts` (add cases for the 4 new fns)

### Task 4.1: Add 4 new track* fns to `lib/analytics/client.ts`

- [ ] **Step 1: Append to the file**

```ts
export function trackEvidencePackLandingView(): void {
  emit("evidence_pack_landing_view", {});
}

export function trackEvidencePackMiniSummaryRun(domain: string): void {
  emit("evidence_pack_minisummary_run", { domain });
}

export function trackEvidencePackBuyClick(domain: string): void {
  emit("evidence_pack_buy_click", { domain });
}

export function trackEvidencePackUpsellClick(source: "dossier" | "tools" | "home"): void {
  emit("evidence_pack_upsell_click", { source });
}
```

### Task 4.2: Wire `trackEvidencePackLandingView` to the landing

**Files:**
- Create: `app/evidence-pack/EvidencePackPageView.tsx` (client; mount-effect tracker)
- Modify: `app/evidence-pack/page.tsx` (mount the tracker)

Mirror the existing `DossierViewTracker` pattern at `components/dossier/DossierViewTracker.tsx`.

- [ ] **Step 1: Author the tracker**

```tsx
"use client";

import { trackEvidencePackLandingView } from "@/lib/analytics/client";
import { useEffect } from "react";

export function EvidencePackPageView() {
  useEffect(() => {
    trackEvidencePackLandingView();
  }, []);
  return null;
}
```

- [ ] **Step 2: Mount in the page**

In `app/evidence-pack/page.tsx`, add to imports:

```tsx
import { EvidencePackPageView } from "./EvidencePackPageView";
```

…and mount inside the returned `<article>`, just after `<TerminalPrompt>`:

```tsx
<EvidencePackPageView />
```

### Task 4.3: Wire mini-summary fire

**Files:**
- Create: `components/evidence-pack/MiniSummaryViewTracker.tsx` (client)
- Modify: `components/evidence-pack/MiniSummary.tsx`

- [ ] **Step 1: Author the tracker**

```tsx
"use client";

import { trackEvidencePackMiniSummaryRun } from "@/lib/analytics/client";
import { useEffect } from "react";

export function MiniSummaryViewTracker({ domain }: { domain: string }) {
  useEffect(() => {
    trackEvidencePackMiniSummaryRun(domain);
  }, [domain]);
  return null;
}
```

- [ ] **Step 2: Mount inside `<MiniSummary>`**

In `components/evidence-pack/MiniSummary.tsx`, add the import + place `<MiniSummaryViewTracker domain={domain} />` right after the `<h2>`.

### Task 4.4: Unit-test the new track fns

**Files:**
- Create or Modify: `tests/unit/lib/analytics/client.test.ts`

If the file exists, append the four new cases. If it doesn't, create it.

- [ ] **Step 1: Author tests**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackEvidencePackBuyClick,
  trackEvidencePackLandingView,
  trackEvidencePackMiniSummaryRun,
  trackEvidencePackUpsellClick,
} from "@/lib/analytics/client";

describe("evidence pack analytics", () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    (globalThis as { window?: { gtag?: typeof gtag } }).window = { gtag };
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("emits evidence_pack_landing_view with no params", () => {
    trackEvidencePackLandingView();
    expect(gtag).toHaveBeenCalledWith("event", "evidence_pack_landing_view", {});
  });

  it("emits evidence_pack_minisummary_run with the domain", () => {
    trackEvidencePackMiniSummaryRun("example.com");
    expect(gtag).toHaveBeenCalledWith("event", "evidence_pack_minisummary_run", {
      domain: "example.com",
    });
  });

  it("emits evidence_pack_buy_click with the domain", () => {
    trackEvidencePackBuyClick("example.com");
    expect(gtag).toHaveBeenCalledWith("event", "evidence_pack_buy_click", {
      domain: "example.com",
    });
  });

  it("emits evidence_pack_upsell_click with the source", () => {
    trackEvidencePackUpsellClick("dossier");
    expect(gtag).toHaveBeenCalledWith("event", "evidence_pack_upsell_click", {
      source: "dossier",
    });
  });

  it("is a no-op when window.gtag is undefined", () => {
    (globalThis as { window?: { gtag?: unknown } }).window = {};
    expect(() => trackEvidencePackLandingView()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm test tests/unit/lib/analytics/client.test.ts
```

Expected: all 5 tests pass.

### Task 4.5: Commit Phase 4

- [ ] **Step 1: Commit**

```bash
git add lib/analytics/client.ts \
  tests/unit/lib/analytics/client.test.ts \
  app/evidence-pack/EvidencePackPageView.tsx \
  app/evidence-pack/page.tsx \
  components/evidence-pack/MiniSummaryViewTracker.tsx \
  components/evidence-pack/MiniSummary.tsx
git commit -m "feat(analytics): evidence_pack_* events + view trackers"
```

---

## Phase 5 — Upsell components + wiring

**Files:**
- Create: `components/evidence-pack/UpsellBanner.tsx` (client)
- Create: `components/evidence-pack/UpsellLink.tsx` (client; for compact placements)
- Modify: `app/d/[domain]/page.tsx` — append `<UpsellBanner domain={d} source="dossier"/>` after `<WebSurfaceSection>`
- Modify: `app/tools/page.tsx` — featured "Evidence Pack" card above the existing featured section
- Modify: `app/page.tsx` — single line under the dossier card

### Task 5.1: Create `components/evidence-pack/UpsellBanner.tsx`

**Files:**
- Create: `components/evidence-pack/UpsellBanner.tsx`

- [ ] **Step 1: Author**

```tsx
"use client";

import { trackEvidencePackUpsellClick } from "@/lib/analytics/client";
import { buildBuyUrl } from "@/lib/evidence-pack/constants";

type Source = "dossier" | "tools" | "home";

export function UpsellBanner({ domain, source }: { domain?: string; source: Source }) {
  return (
    <aside className="border p-4 space-y-2">
      <h3 className="text-sm">need this as audit-grade evidence?</h3>
      <p className="text-sm text-muted">
        the evidence pack adds 5 more checks (mta-sts, tlsrpt, dnssec, whois, ct-log subdomains),
        severity grading, dpdp / iso 27001 / soc 2 framework mapping, and a signed pdf + zip your
        auditors can verify.
      </p>
      <a
        href={buildBuyUrl(domain)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvidencePackUpsellClick(source)}
        className="inline-block border px-4 py-2 text-sm hover:border-accent"
      >
        get evidence pack →
      </a>
    </aside>
  );
}
```

### Task 5.2: Wire the dossier-side upsell

**Files:**
- Modify: `app/d/[domain]/page.tsx`

- [ ] **Step 1: Add import + insertion**

At the top of the file (after the existing imports), add:

```tsx
import { UpsellBanner } from "@/components/evidence-pack/UpsellBanner";
```

Inside the returned `<article>`, after the `<WebSurfaceSection>` Suspense block (which is the last existing section), add:

```tsx
<UpsellBanner domain={d} source="dossier" />
```

> **Constraint:** must NOT alter rate-limit, denylist, OG image, or any data flow. Pure additive.

### Task 5.3: Wire the tools-hub upsell

**Files:**
- Modify: `app/tools/page.tsx`

- [ ] **Step 1: Insert the upsell banner ABOVE the existing featured section (do not replace)**

Add the import:

```tsx
import { UpsellBanner } from "@/components/evidence-pack/UpsellBanner";
```

Then in the JSX, **immediately before** the existing `<section className="space-y-3 border p-4">…domain dossier…</section>` (so the Evidence Pack appears first, the Dossier featured card appears second):

```tsx
<section className="space-y-3">
  <UpsellBanner source="tools" />
</section>
```

Result: two stacked sections — Evidence Pack first, Domain Dossier second. The existing dossier featured section is untouched.

### Task 5.4: Wire the home-page upsell

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add a one-line callout beneath the tools grid**

Add the import:

```tsx
import { UpsellBanner } from "@/components/evidence-pack/UpsellBanner";
```

Inside the `<div className="space-y-10">` returned from `Home()`, after the closing `</section>` of `id="tools"`, add:

```tsx
<section>
  <UpsellBanner source="home" />
</section>
```

### Task 5.5: Verify Phase 5

- [ ] **Step 1: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Smoke E2E**

```bash
pnpm test:e2e tests/e2e/smoke.spec.ts
```

Expected: passes (existing tests untouched, the new banner doesn't break the home grid).

- [ ] **Step 3: Commit**

```bash
git add components/evidence-pack/UpsellBanner.tsx \
  app/d/\[domain\]/page.tsx \
  app/tools/page.tsx \
  app/page.tsx
git commit -m "feat(evidence-pack): upsell banner on /d/<domain>, /tools, and home"
```

---

## Phase 6 — Sitemap, README, docs

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `README.md`
- Create: `docs/notes/evidence-pack.md`

### Task 6.1: Add `/evidence-pack` to sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Insert one line into `staticPaths`**

Find the line:

```ts
{ url: `${base}/domain-dossier`, changeFrequency: "weekly", priority: 0.9 },
```

And add directly after:

```ts
{ url: `${base}/evidence-pack`, changeFrequency: "weekly", priority: 0.9 },
```

### Task 6.2: README mention

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Insert a paragraph near the project description**

Add the following section to `README.md` (location: after the existing intro / above the "Tools" section if there is one):

```markdown
## Evidence Pack (paid sibling)

drwho.me's free Domain Dossier is the foundation for a paid product —
the **Evidence Pack** — which lives in the proprietary sibling repo
[`hikmahtech/app-drwho`](https://github.com/hikmahtech/app-drwho) and is
served at `app.drwho.me`. The marketing landing on this site is
[`/evidence-pack`](https://drwho.me/evidence-pack).
The shared check library is published as
[`@drwhome/dossier-checks`](https://www.npmjs.com/package/@drwhome/dossier-checks).
```

### Task 6.3: Add `docs/notes/evidence-pack.md`

**Files:**
- Create: `docs/notes/evidence-pack.md`

- [ ] **Step 1: Author the doc**

```markdown
# Evidence Pack — drwho-side note

The drwho.me Evidence Pack is a paid product that lives in a separate private
sibling repo: [`hikmahtech/app-drwho`](https://github.com/hikmahtech/app-drwho).

This MIT-licensed public repo contributes:

1. **Marketing surface** — `app/evidence-pack/` (landing page with live 3-check
   mini-summary, pricing card, FAQ, JSON-LD).
2. **Free-tier upsell CTAs** — `components/evidence-pack/UpsellBanner.tsx`,
   wired into `app/d/[domain]/page.tsx`, `app/tools/page.tsx`, and `app/page.tsx`.
3. **Shared check library** — `packages/dossier-checks/` (the
   `@drwhome/dossier-checks` npm package).

Crown-jewel logic (rules engine, framework mapping tables, snippet templates,
PDF rendering, customer accounts, billing, GST invoicing) lives in the private
sibling repo, **not** here.

## Specs

- Master design (private repo): `docs/superpowers/specs/2026-04-25-evidence-pack-design.md`
- Companion design (this repo): `docs/superpowers/specs/2026-04-25-evidence-pack-companion-design.md`
- Implementation plan (this repo): `docs/superpowers/plans/2026-04-25-evidence-pack-companion.md`
```

### Task 6.4: Commit Phase 6

- [ ] **Step 1: Commit**

```bash
git add app/sitemap.ts README.md docs/notes/evidence-pack.md
git commit -m "docs(evidence-pack): sitemap entry, README note, contributor note"
```

---

## Phase 7 — E2E + Lighthouse + final verification

**Files:**
- Create: `tests/e2e/evidence-pack.spec.ts`
- Modify: `.lighthouserc.json`

### Task 7.1: Add Playwright E2E for `/evidence-pack`

**Files:**
- Create: `tests/e2e/evidence-pack.spec.ts`

- [ ] **Step 1: Author the test**

```ts
import { expect, test } from "@playwright/test";

test.describe("/evidence-pack landing", () => {
  test("renders hero + pricing + faq without a domain", async ({ page }) => {
    await page.goto("/evidence-pack");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /automated domain security/i,
    );
    await expect(page.getByText(/₹\s*7,500/i)).toBeVisible();
    await expect(page.getByText(/what's in the pack/i)).toBeVisible();
    await expect(page.getByText(/sample report/i)).toBeVisible();
  });

  test("renders mini-summary when ?domain= is set", async ({ page }) => {
    await page.goto("/evidence-pack?domain=example.com");
    await expect(page.getByText(/live preview — 3 of 15 checks/i)).toBeVisible();
    // dns, dmarc, tls labels in the mini-summary
    await expect(page.getByText(/^dns$/, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/^dmarc$/, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/^tls$/, { exact: false }).first()).toBeVisible();
  });

  test("buy button has the correct outbound URL", async ({ page }) => {
    await page.goto("/evidence-pack?domain=example.com");
    const buyLink = page.getByRole("link", { name: /buy evidence pack/i }).first();
    await expect(buyLink).toHaveAttribute("href", /app\.drwho\.me\/buy\?domain=example\.com/);
    await expect(buyLink).toHaveAttribute("target", "_blank");
  });

  test("upsell banner on /d/example.com links to /buy", async ({ page }) => {
    await page.goto("/d/example.com");
    const cta = page.getByRole("link", { name: /get evidence pack/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /app\.drwho\.me\/buy\?domain=example\.com/);
  });

  test("input redirects to /evidence-pack?domain=", async ({ page }) => {
    await page.goto("/evidence-pack");
    await page.getByLabel("domain").fill("EXAMPLE.com  ");
    await page.getByRole("button", { name: /check/i }).click();
    await expect(page).toHaveURL(/\/evidence-pack\?domain=example\.com$/);
  });
});
```

- [ ] **Step 2: Run the new spec**

```bash
pnpm test:e2e tests/e2e/evidence-pack.spec.ts
```

Expected: 5/5 passing. If the mini-summary test times out, extend Playwright's default `expect` timeout in this file via `test.use({ actionTimeout: 15000 });` because dns/dmarc/tls live calls can take up to 10s.

### Task 7.2: Add `/evidence-pack` to Lighthouse CI

**Files:**
- Modify: `.lighthouserc.json`

- [ ] **Step 1: Add the URL**

In the `ci.collect.url` array, add `"http://localhost:3000/evidence-pack"`. The full block becomes:

```json
"url": [
  "http://localhost:3000/",
  "http://localhost:3000/tools/base64",
  "http://localhost:3000/tools/jwt",
  "http://localhost:3000/tools/dns",
  "http://localhost:3000/blog",
  "http://localhost:3000/blog/decode-jwt-without-verifying",
  "http://localhost:3000/d/example.com",
  "http://localhost:3000/evidence-pack"
]
```

### Task 7.3: Run full verification

- [ ] **Step 1: Type-check**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Lint (Biome)**

```bash
pnpm lint
```

Expected: clean. If Biome flags single-quote-inside-double-quote or inline JSON arrays, run `pnpm format` and re-commit.

- [ ] **Step 3: Unit tests**

```bash
pnpm test
```

Expected: all passing.

- [ ] **Step 4: E2E**

```bash
pnpm test:e2e
```

Expected: all passing including the new spec.

- [ ] **Step 5: Lighthouse CI**

```bash
pnpm lh
```

Expected: Performance ≥ 0.95, SEO ≥ 0.95 across **all 8 URLs** including `/evidence-pack`.

> If `/evidence-pack` SEO < 0.95: most-likely cause is missing meta description / canonical / structured data. Verify `pageMetadata({ path: "/evidence-pack", … })` is feeding `alternates.canonical` and the `<JsonLd>` blocks are rendered (look for `application/ld+json` in the HTML).
>
> If perf < 0.95: the live mini-summary may inflate LCP; try profiling with the URL **without** `?domain=` (the no-domain hero). Lighthouse hits `/evidence-pack` (no query) so the live checks shouldn't run.

### Task 7.4: Commit Phase 7 + push

- [ ] **Step 1: Commit**

```bash
git add tests/e2e/evidence-pack.spec.ts .lighthouserc.json
git commit -m "test(evidence-pack): playwright spec + add /evidence-pack to lighthouse CI"
```

- [ ] **Step 2: Push to existing PR #11**

```bash
git push
```

Expected: pushes to `origin/worktree-evidence-pack-companion-spec`. PR #11 picks up the new commits automatically.

- [ ] **Step 3: Update PR description**

```bash
gh pr edit 11 --body "$(cat <<'EOF'
## Summary

- Adds `docs/superpowers/specs/2026-04-25-evidence-pack-companion-design.md` (the drwho-side companion spec).
- Adds `docs/superpowers/plans/2026-04-25-evidence-pack-companion.md` (the implementation plan executed in this PR).
- Implements all three workstreams in the spec:
  - **Phase 1**: extracted `lib/dossier/checks/*` + types/ids/validate-domain into the new pnpm workspace package `packages/dossier-checks/` (publishable as `@drwhome/dossier-checks`).
  - **Phase 2–4**: new `/evidence-pack` landing with live 3-check mini-summary, pricing card, FAQ, JSON-LD, analytics events.
  - **Phase 5**: `<UpsellBanner>` wired into `/d/<domain>`, `/tools`, and home.
  - **Phase 6**: sitemap entry, README, contributor note.
  - **Phase 7**: Playwright spec for `/evidence-pack`; `/evidence-pack` added to Lighthouse CI.

## Test plan

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test` (Vitest) all green — including new analytics tests
- [x] `pnpm test:e2e` (Playwright) all green — including new evidence-pack spec
- [x] `pnpm lh` (Lighthouse CI) Perf + SEO ≥ 0.95 across 8 URLs (including `/evidence-pack`)
- [x] `/d/example.com` upsell banner renders + outbound link points at `app.drwho.me/buy?domain=example.com`
- [x] `/evidence-pack?domain=example.com` mini-summary renders DNS + DMARC + TLS

## Out of scope

- Anything inside `app.drwho.me` (paid app) — that lives in the private sibling repo `hikmahtech/app-drwho` and is tracked by its own master spec.
- npm publish of `@drwhome/dossier-checks` — first publish is a one-time manual run after npm scope verification (notes in `packages/dossier-checks/README.md`).
EOF
)"
```

### Task 7.5: (Optional, post-merge) First npm publish

After PR #11 merges to `main`, do the one-time npm setup. This step is **not** part of the PR — execute it manually once `main` is updated.

- [ ] **Step 1: Verify the npm scope `@drwhome` is registered to your account**

```bash
npm whoami
npm org ls @drwhome 2>&1 || echo "scope not yet visible — log in / accept invite"
```

If the scope doesn't exist, create it via https://www.npmjs.com/org/create as `drwhome` (free Org plan is fine for public packages).

- [ ] **Step 2: Build + publish**

```bash
git checkout main
git pull
pnpm -F @drwhome/dossier-checks build
pnpm -F @drwhome/dossier-checks publish --access=public
```

Expected: `+ @drwhome/dossier-checks@0.1.0` confirmation.

- [ ] **Step 3: Tag the release**

```bash
git tag dossier-checks-v0.1.0
git push origin dossier-checks-v0.1.0
```

---

## Self-review notes

- **Spec coverage:** every section of the companion spec maps to at least one phase: §4.1 → Phase 2+3, §4.2 → Phase 5.2, §4.3 → Phase 5.3, §4.4 → Phase 5.4, §4.5 → Phase 6.1, §4.6 → Phase 2.5 (canonical via `pageMetadata`), §4.7 → Phase 6.2+6.3, §5 → Phase 1, §6 risks → mitigated via the redacted-PDF placeholder note + free-tier copy in landing.
- **Type consistency:** `MiniSummarySection` summarises by reading specific fields off check `data` (`records`, `record`, `notAfter`, `issuerCommonName`). The author of Task 3.2 must verify those field names against `packages/dossier-checks/src/checks/{dns,dmarc,tls}.ts` and adjust the summariser — not the source — if names differ. Flagged inline in Task 3.2.
- **Order dependency:** Phase 4 (analytics fns) must land before Phase 2 commits typecheck-clean because `BuyButton.tsx` imports `trackEvidencePackBuyClick`. Recommended execution order: 1 → 4 → 2 → 3 → 5 → 6 → 7. Flagged inline in Task 2.4 step 2.
- **Risk: package extraction breaks nothing.** Phase 1.8–1.11 is the integrity gate. If any of typecheck / Vitest / Playwright / Lighthouse fail, halt and reduce scope (e.g. revert the codemod and add a barrel `lib/dossier/checks/index.ts` that re-exports from the package, so consumers' import paths don't change).
