# Evidence Pack — Companion Design Spec (drwho-side changes)

**Status:** draft (not started)
**Author:** arshad@hikmahtechnologies.com
**Date:** 2026-04-25
**Repo:** `hikmahtech/drwhome` (this repo, MIT, public)
**Master spec:** `hikmahtech/app-drwho` →
`docs/superpowers/specs/2026-04-25-evidence-pack-design.md`

---

## 1. Background

The Evidence Pack paid product is being built as a separate Next.js app at
`app.drwho.me`, hosted on Homelab Swarm in the proprietary sibling repo
`hikmahtech/app-drwho`. See the master spec for the full product design.

The free public `drwho.me` (this repo) plays three roles in the product:

1. **Marketing surface** — `/evidence-pack` landing page that explains the
   product, runs a live mini-summary, and CTAs to `app.drwho.me/buy`.
2. **Free-tier teaser** — existing `/d/<domain>` dossier and tools surface
   gain a non-intrusive "Get Evidence Pack" CTA.
3. **Shared check library** — `lib/dossier/checks/*.ts` is extracted into a
   publishable npm package (`@drwhome/dossier-checks`) so app-drwho can consume
   the same exact check logic without duplication or drift.

This spec covers (1), (2), and (3). Everything else (DB, worker, payments, PDF,
auth, customer portal, GST invoicing) is in the master spec.

---

## 2. Goals

1. Capture buyer intent on `drwho.me` with a high-quality `/evidence-pack`
   landing page.
2. Convert existing free-traffic surfaces (`/d/<domain>`, `/tools`, home) with
   non-intrusive CTAs.
3. Extract `lib/dossier/checks` as a versioned npm package so app-drwho stays
   in sync with check fixes shipped here.

## 3. Non-goals

- Any payment-related code in this repo. Lives in `app-drwho`.
- Any user-account / order / scan-job state in this repo.
- Any rendering of paid artefacts in this repo.
- Tracking individual buyer identity (analytics events stay anonymous;
  stick to existing `lib/analytics/client.ts` shape).

---

## 4. Surfaces to add or modify

### 4.1 `/evidence-pack` (new)

Marketing landing at `app/evidence-pack/page.tsx`. Sections:

- **Hero** — "Automated, evidence-grade domain security report. Indian
  compliance, in 30 minutes." Domain input + "Buy for ₹X" CTA.
- **Live mini-summary** — when buyer enters a domain, run **3 of 15 checks**
  inline using the existing pure check fns (DNS, DMARC, TLS). Pure RSC, no
  client-side scan. Show "12 more checks unlocked with the Evidence Pack"
  upsell.
- **What's in the pack** — bulleted: PDF report, evidence ZIP, signed manifest,
  DPDP / ISO 27001 / SOC 2 questionnaire snippets, GST invoice.
- **Sample artefact** — anchor link to a downloadable redacted sample PDF
  (hosted at `/sample-evidence-pack.pdf` in `public/`).
- **Pricing card** — single hardcoded INR price for v1 (price changes
  require a redeploy; Vercel bakes env vars at build time so a "runtime
  override" is illusory). Note multi-domain discount, GST-invoice
  availability, refund SLA, payment options (Razorpay primary; PayPal for
  international). Source of truth for the price ultimately lives in
  `app-drwho`; this landing keeps a synchronised constant and ships a
  deploy when changed.
- **CTA** — "Buy" → outbound link to
  `https://app.drwho.me/buy?domain=<entered-domain>`.
- **Trust signals** — link to the public open-source check library, hash-
  manifest verification flow explanation.
- **JSON-LD** — `Product` + `FAQPage` structured data for SEO (mirror existing
  `domain-dossier` landing pattern).
- **Analytics events** —
  `evidence_pack_landing_view`,
  `evidence_pack_minisummary_run`,
  `evidence_pack_buy_click`.

### 4.2 `/d/<domain>` (modify)

Add a non-intrusive CTA component near the bottom of the dossier page:

> "This is the free 10-check dossier. The Evidence Pack adds 5 more checks,
> framework-mapped findings (DPDP / ISO 27001 / SOC 2), and a buyer-grade
> PDF + signed evidence ZIP. **Get Evidence Pack →**"

Single button → `https://app.drwho.me/buy?domain=<domain>`.

Implementation: new `<EvidencePackUpsell domain={...} />` server component at
`components/evidence-pack/UpsellBanner.tsx`, imported into
`app/d/[domain]/page.tsx` after the existing dossier sections.

Analytics event: `evidence_pack_dossier_cta_click`.

Constraint: must NOT modify the OG image, the rate-limit budget, or the
data-flow on the dossier page. Pure additive insertion.

### 4.3 `/tools` hub (modify)

Add an "Evidence Pack" highlighted card at the top of the tools grid (above
the network/dev category groups). Click → `/evidence-pack`. Reuse existing
tool-card visual pattern with a "Paid" pill.

Analytics event: `evidence_pack_tools_cta_click`.

### 4.4 Home `/` page (modify)

Add a single line beneath the existing dossier feature on the home grid:

> "Need it as evidence for an audit? **Get the Evidence Pack →**"

Linking to `/evidence-pack`.

### 4.5 Sitemap

Add `/evidence-pack` to `app/sitemap.ts` with `priority: 0.9, changefreq: weekly`.

### 4.6 Robots / SEO

`/evidence-pack` is the primary commercial landing — index and follow.
Set canonical, OG image (reuse existing OG generator with overlay text
"Evidence Pack").

### 4.7 README + `docs/notes/`

Add a section to `README.md` referencing the paid sibling product and the
master spec link. Add `docs/notes/evidence-pack.md` with a short paragraph
linking to the master spec for future contributors.

---

## 5. `@drwhome/dossier-checks` extraction

The 10 existing dossier checks at `lib/dossier/checks/*.ts` and their shared
types must be extractable as a versioned npm package so app-drwho can take a
direct dependency on them.

### 5.1 Approach

- Convert the root `package.json` to use **pnpm workspaces** (`packages/*`).
- Move `lib/dossier/checks/` (the pure check fns + types only — not the cache
  wrapper, not the section components) into `packages/dossier-checks/src/`.
- Add `packages/dossier-checks/package.json` with:
  - `name: "@drwhome/dossier-checks"`
  - `version: "1.0.0"` initially
  - `main` / `module` / `types` pointing at `tsup`-built output
  - `publishConfig.access: "public"`
- Build via `tsup` to ESM + CJS + .d.ts. (Vitest + Playwright continue to run
  against TypeScript source, no behaviour change.)
- Re-export from current `lib/dossier/checks/index.ts` import paths via barrel
  file so existing components in `components/dossier/sections/*` and the cache
  wrapper at `lib/dossier/cache.ts` keep working unchanged.
- Add a `pnpm publish --access=public` step (manual at first; GitHub Action
  later).
- npm scope: register `@drwhome` on npmjs.com under
  `arshad@hikmahtechnologies.com`.

### 5.2 What stays in the public app (not in the package)

These remain in `lib/dossier/`, NOT in the package:

- `lib/dossier/cache.ts` (Vercel-specific `unstable_cache` wrapper)
- `lib/dossier/registry.ts` (web-UI registry of checks → tool slugs)
- `lib/dossier/denylist.ts`
- `lib/dossier/rateLimit.ts`
- `app/d/[domain]/*` and `components/dossier/sections/*` (UI)

The package is **logic only**, not UI nor caching nor product policy.

### 5.3 What goes in the package

- `packages/dossier-checks/src/checks/{dns,mx,spf,dmarc,dkim,tls,redirects,headers,cors,web-surface}.ts`
- `packages/dossier-checks/src/types.ts` — `CheckResult`, `CheckId`, etc.
- `packages/dossier-checks/src/index.ts` — barrel exports
- `packages/dossier-checks/README.md`
- `packages/dossier-checks/LICENSE` — MIT (mirrors root)

### 5.4 Versioning + release flow

- Semver. Bug fixes → patch; new optional fields on result types → minor;
  signature changes → major.
- Release flow v1: human runs `pnpm -F @drwhome/dossier-checks publish` after
  bumping version. v1.1 may automate via a GitHub Action triggered on
  `packages/dossier-checks/CHANGELOG.md` change.
- Tag releases as `dossier-checks-v<version>` so they don't collide with
  drwho.me deploy tags.

### 5.5 Risk

- **Vitest + Playwright still pass** after extraction: this is the gate. We
  don't merge if any test fails.
- **Lighthouse CI still passes**: extraction is build-time only; runtime
  performance unchanged.

---

## 6. Risks

### 6.1 Sample PDF leak

The sample PDF we publish at `/sample-evidence-pack.pdf` reveals our PDF
design + rules-engine output style to competitors and would-be forkers.

**Mitigation:**
- Redact the specific finding text in the sample (replace with generic
  placeholders).
- Blur or watermark the framework mapping appendix.
- Use a synthetic domain (e.g. `example.com`) so the data is public-facing
  anyway.

### 6.2 Free-tier cannibalisation

Buyers may decide the free dossier is "enough" once they see the upsell.

**Mitigation:**
- Free dossier deliberately omits framework mapping, manifest signing,
  remediation rationale, severity grading, and the questionnaire snippets.
- CTA copy emphasises **evidence-grade vs preview-grade**:
  > "The dossier shows what is. The Evidence Pack proves it — signed,
  > timestamped, and mapped to the controls auditors ask about."

### 6.3 npm package release mechanics

Publishing to npm under a new `@drwhome` scope requires:
- Email verification on the scope.
- Two-factor auth on the publishing account.
- A first publish run to seed the scope.

These are one-time setup tasks; document in `packages/dossier-checks/README.md`.

---

## 7. Out of scope

- Any code that touches order / scan / payment state — lives in `app-drwho`.
- Any DB or worker code in this repo.
- Any auth flows in this repo.
- Refactoring unrelated dossier code "while we're here".

---

## 8. Sequencing

This spec is comparatively small. Rough order for the implementation plan
(writing-plans phase):

| Step | Work                                                          | Effort |
|------|---------------------------------------------------------------|--------|
| 1    | Convert root to pnpm workspace; create `packages/dossier-checks` skeleton | 2 h    |
| 2    | Move checks into the package; add `tsup` build; barrel re-export | 4 h    |
| 3    | Verify `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, Lighthouse all green | 2 h    |
| 4    | npm scope setup + first publish of `@drwhome/dossier-checks@1.0.0` | 1 h    |
| 5    | Build `/evidence-pack` landing — hero, sample, pricing card, JSON-LD (no live mini-summary yet) | 4 h    |
| 6    | Add live mini-summary using the now-published checks package    | 2 h    |
| 7    | Build `<EvidencePackUpsell>` component                          | 2 h    |
| 8    | Wire upsell into `/d/<domain>`, `/tools`, home                  | 2 h    |
| 9    | Add `evidence_pack_*` analytics events to `lib/analytics/client.ts` | 1 h    |
| 10   | Sitemap, README, OG image overlay, `docs/notes/evidence-pack.md` | 2 h    |
| 11   | Smoke E2E test for `/evidence-pack` (visit, fill domain, click "Buy" goes outbound) | 2 h    |

**Estimated effort: ~24 hours of focused work** — roughly one part-time week.

---

## 9. Related artefacts

- Master spec: `hikmahtech/app-drwho` →
  `docs/superpowers/specs/2026-04-25-evidence-pack-design.md`
- Existing dossier registry: `lib/dossier/registry.ts`,
  `lib/dossier/checks/*.ts`
- Existing analytics helper: `lib/analytics/client.ts`
- Existing CTA pattern: `components/blog/ToolCtaLink.tsx`
- Existing OG generator: `app/d/[domain]/opengraph-image.tsx`
- Lighthouse CI config: `lighthouserc.json` (must keep `/evidence-pack` ≥ 95
  on perf + SEO)
