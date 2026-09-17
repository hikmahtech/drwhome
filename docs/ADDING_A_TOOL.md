# Adding a tool

Read this before you add or change a tool. Working examples of every kind already exist; copy them.

## The three kinds

`src/content/tools.ts` lists every tool and its kind. A tool goes live by itself once its files
exist (`src/content/ready.ts`). Do not add a "ready" flag anywhere.

| Kind | What it is | Files it needs | Example |
|---|---|---|---|
| `check` | One domain in, a report out | an entry in `src/checks/browser.ts` or `src/checks/server.ts`, a rows function in `src/reports/<slug>.ts` | `spf-checker` (browser), `security-headers-checker` (server) |
| `live` | A form worked out in the page as you type | `src/lib/<name>.ts` (pure logic), `src/client/<slug>.ts`, `src/views/forms/<slug>.tsx` | `base64` |
| `page` | Rendered whole on the server from the request | `src/views/pages/<slug>.tsx` | `ip` |

Every tool also gets `src/views/prose/<slug>.tsx` (default export) and unit tests in `tests/unit/`.
Views are found by file name (`src/views/load.ts`), so you never edit an index file.

## Reports

Every result is a `Report` (`src/reports/report.ts`): a verdict, a tone, and rows of
label / value / note. The browser (`src/client/_render.ts`) and the server
(`src/views/ReportView.tsx`) render the same data.

- For a check that Domain Posture's rules engine grades (`RuleSlug` in
  `@hikmahtech/dossier-checks`), use `gradedReport(rule, result, domain, rows)`. The verdict and
  the "To fix" rows then come from the same rule Domain Posture uses. You only write `rows(data)`.
- For anything else, build the `Report` yourself and use `reportFailure` for the non-ok states.
- `not_applicable` means "we looked and it is absent". `error` means "we could not tell". Never
  show an error as an absence.
- Rows: short label, the raw value in `value` (it renders in monospace; join lists with `\n`),
  plain-English `note` only when it helps. Group long lists into one row. Do not make 20 rows.
- Tones: `good`, `warn`, `bad`, `plain`. Use colour for findings, not decoration.

## Checks

- Check logic comes from `@hikmahtech/dossier-checks`. Do not re-implement a check that the
  package has. Read its types in `node_modules/@hikmahtech/dossier-checks/dist/index.d.ts`.
- `src/checks/browser.ts` may import nothing that needs Node. It is bundled for the browser.
  A browser check may only call public APIs that send `Access-Control-Allow-Origin: *`, and the
  host must be listed in `connectSrc` in `src/app.tsx`.
- Server checks are always called through `guardedRun` (`src/server/ssrf.ts`). The route in
  `src/app.tsx` already does this for every entry in `serverOnlyChecks`. Never call `fetch` on a
  visitor-supplied host any other way.

## Live tools

- Pure logic goes in `src/lib/<name>.ts` with no DOM and no Node imports, because the MCP server
  calls the same functions. Return `{ ok: true, ... } | { ok: false, error }` for anything that
  can fail. Error messages are full sentences a person can act on.
- The form is a `<dw-live tool="slug">` wrapping a `<form class="sheet">` and a `<div data-out>`.
  `src/client/<slug>.ts` calls `defineLive(fields => output)`. Output is `{ text }`, `{ report }`,
  `{ error }` or `null` for "nothing to show yet". It may be async.
- A tool that makes a network call uses `<dw-live on="submit">` and has a submit button.
- Existing form classes: `sheet`, `seg` (segmented radio group), `field` (label + input),
  `tick` (checkbox), `btn`, `label`. Reuse them. Add CSS only if nothing fits, at the end of
  `public/css/site.css`, using the colour tokens at the top of that file. No new colours, no
  rounded corners, no shadows.

## Writing

Plain English. Short sentences, common words, active voice. Say what the tool checks, what to look
for, and the common mistake. Three short sections at most. No hype, no "simply", no "powerful".
Never call something secure or insecure without saying why.

Links to Domain Posture never go straight to domainposture.com. They go to `/domain-report`
(a page on this site that explains it), or through `/go/<target>`, which adds the UTM tags.

## Before you finish

```
node scripts/build-client.mjs
npx tsc --noEmit
node_modules/.bin/biome check --write .
pnpm test 2>&1 | tee logs/test-output.log
```

All four must be clean. Test the logic, not the framework: inputs that matter, the failure
states, and anything a hostile input could break.
