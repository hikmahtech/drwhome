# drwho.me — Plan 2: Remaining 9 Tools (v1 completion)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the v1 tool suite. Plan 1 shipped Base64 as the first end-to-end tool. This plan adds the other 9 tools — 5 dev utilities (JSON, URL, UUID, JWT, User Agent) and 4 network tools (What-is-my-IP, HTTP Headers, IP Lookup, DNS Lookup). Every new tool follows the same pattern: pure function in `lib/tools/<name>.ts` + React UI in `components/tools/<Name>.tsx` + entry in `content/tools.ts`. Network tools add a server route under `app/api/`.

**Architecture:** Reuses all Plan 1 primitives (`TerminalCard`, `TerminalPrompt`, `CopyButton`, `ThemeToggle`, the dynamic `/tools/[slug]` route, etc.). No new layout surfaces. Registry-driven: adding each tool is one entry in `content/tools.ts`; all downstream (home grid, sitemap generation in Plan 3, MCP server in Plan 4) inherits the new tool automatically.

**Tech Stack:** Plan 1 stack + `ua-parser-js` (User Agent tool). Everything else uses standard Web APIs (`crypto.randomUUID`, `atob`, `TextDecoder`, `fetch`).

**Reference spec:** `docs/superpowers/specs/2026-04-16-drwho-me-design.md`
**Built on:** Plan 1 (`docs/superpowers/plans/2026-04-16-drwho-01-foundation.md`, tagged `plan-1-complete`)

**Out of scope (covered later):**
- Blog + MDX + launch articles + sitemap + per-page SEO depth (Plan 3)
- MCP endpoint + paywall + waitlist (Plan 4)
- AdSense + consent banner + affiliate wiring (Plan 5)

---

## File Structure

**Created or modified by Plan 2:**

```
drwho/
├── app/
│   ├── tools/[slug]/page.tsx         # MODIFIED — add force-dynamic override per tool if needed
│   └── api/
│       ├── whoami/route.ts           # NEW — returns edge-header IP info
│       ├── ip-lookup/route.ts        # NEW — proxies ipinfo.io (server-only token)
│       └── dns/route.ts              # NEW — proxies Cloudflare DoH
├── components/tools/
│   ├── Json.tsx                      # NEW
│   ├── UrlCodec.tsx                  # NEW
│   ├── Uuid.tsx                      # NEW
│   ├── Jwt.tsx                       # NEW
│   ├── UserAgent.tsx                 # NEW
│   ├── WhatIsMyIp.tsx                # NEW — server component + client refresh
│   ├── Headers.tsx                   # NEW — server component
│   ├── IpLookup.tsx                  # NEW
│   └── Dns.tsx                       # NEW
├── content/tools.ts                  # MODIFIED — 9 new entries
└── lib/tools/
    ├── json.ts                       # NEW
    ├── url.ts                        # NEW
    ├── uuid.ts                       # NEW
    ├── jwt.ts                        # NEW
    ├── userAgent.ts                  # NEW
    ├── ipLookup.ts                   # NEW
    └── dns.ts                        # NEW
tests/unit/lib/tools/
├── json.test.ts, url.test.ts, uuid.test.ts, jwt.test.ts, userAgent.test.ts,
│   ipLookup.test.ts, dns.test.ts
tests/e2e/
└── smoke.spec.ts                     # MODIFIED — add 9 new tests, one per tool
.env.example                          # MODIFIED — add IPINFO_TOKEN
```

No changes to layout, theme, Nav, Footer, AdSlot, AffiliateCard, routing shell, or registry type. The registry gains 9 entries.

---

## Task 1: JSON formatter

**Files:**
- Create: `lib/tools/json.ts`
- Create: `tests/unit/lib/tools/json.test.ts`
- Create: `components/tools/Json.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 1.1: Write failing tests**

`tests/unit/lib/tools/json.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatJson } from "@/lib/tools/json";

describe("formatJson", () => {
  it("formats valid JSON with 2-space indent by default", () => {
    const r = formatJson('{"a":1,"b":[2,3]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });
  it("respects indent parameter", () => {
    const r = formatJson('{"a":1}', 4);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{\n    "a": 1\n}');
  });
  it("indent=0 returns minified", () => {
    const r = formatJson('{"a": 1, "b": 2}', 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('{"a":1,"b":2}');
  });
  it("returns error with message on invalid JSON", () => {
    const r = formatJson("{bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/.+/);
  });
  it("handles empty string", () => {
    const r = formatJson("");
    expect(r.ok).toBe(false);
  });
  it("handles nested and arrays", () => {
    const r = formatJson('[{"x":true,"y":null}]');
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run — fail**

```bash
pnpm test json
```
Expected: FAIL (module not found).

- [ ] **Step 1.3: Implement `lib/tools/json.ts`**

```ts
export type JsonResult = { ok: true; value: string } | { ok: false; error: string };

export function formatJson(input: string, indent = 2): JsonResult {
  if (input.trim() === "") return { ok: false, error: "empty input" };
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, indent) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "invalid JSON" };
  }
}
```

- [ ] **Step 1.4: Run — pass**

```bash
pnpm test json
```
Expected: 6 passed.

- [ ] **Step 1.5: Implement `components/tools/Json.tsx`**

```tsx
"use client";
import { useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { formatJson } from "@/lib/tools/json";

export function Json() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const result = formatJson(input, indent);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs items-center">
        <span className="text-muted">indent:</span>
        {[0, 2, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setIndent(n)}
            className={`border px-2 py-0.5 ${indent === n ? "border-accent text-accent" : ""}`}
          >
            {n === 0 ? "min" : n}
          </button>
        ))}
      </div>
      <label className="block text-xs text-muted">
        input
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <TerminalCard label="output">
        {result.ok ? (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">
              {result.value || <span className="text-muted">(empty)</span>}
            </pre>
            {result.value && <CopyButton value={result.value} />}
          </div>
        ) : (
          <span className="text-muted">error: {result.error}</span>
        )}
      </TerminalCard>
    </div>
  );
}
```

- [ ] **Step 1.6: Register in `content/tools.ts`**

Add import at top:
```ts
import { Json } from "@/components/tools/Json";
```

Add entry to `tools` array (keep base64 entry first):
```ts
{
  slug: "json",
  name: "json",
  description: "format and validate JSON. 2 / 4 space or minified output.",
  category: "dev",
  keywords: ["json", "format", "prettify", "validate", "minify"],
  component: Json,
},
```

- [ ] **Step 1.7: Verify + commit**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
All green. `/tools/json` should appear in the build output.

```bash
git add lib/tools/json.ts tests/unit/lib/tools/json.test.ts components/tools/Json.tsx content/tools.ts
git commit -m "feat(tools): json formatter"
```

---

## Task 2: URL encode/decode

**Files:**
- Create: `lib/tools/url.ts`
- Create: `tests/unit/lib/tools/url.test.ts`
- Create: `components/tools/UrlCodec.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 2.1: Tests**

`tests/unit/lib/tools/url.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl } from "@/lib/tools/url";

describe("encodeUrl", () => {
  it("encodes spaces and special chars", () => {
    expect(encodeUrl("hello world/?&=").value).toBe("hello%20world%2F%3F%26%3D");
  });
  it("encodes unicode", () => {
    expect(encodeUrl("café").value).toBe("caf%C3%A9");
  });
  it("empty string passes through", () => {
    expect(encodeUrl("").value).toBe("");
  });
});

describe("decodeUrl", () => {
  it("decodes valid encoded string", () => {
    expect(decodeUrl("hello%20world")).toEqual({ ok: true, value: "hello world" });
  });
  it("decodes unicode", () => {
    expect(decodeUrl("caf%C3%A9")).toEqual({ ok: true, value: "café" });
  });
  it("errors on malformed percent", () => {
    const r = decodeUrl("%ZZ");
    expect(r.ok).toBe(false);
  });
  it("errors on lone percent", () => {
    const r = decodeUrl("%");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run, fail, implement `lib/tools/url.ts`**

```ts
export type UrlEncodeResult = { value: string };
export type UrlDecodeResult = { ok: true; value: string } | { ok: false; error: string };

export function encodeUrl(input: string): UrlEncodeResult {
  return { value: encodeURIComponent(input) };
}

export function decodeUrl(input: string): UrlDecodeResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: "malformed URL encoding" };
  }
}
```

- [ ] **Step 2.3: Run tests — pass (7 tests)**

- [ ] **Step 2.4: `components/tools/UrlCodec.tsx`**

```tsx
"use client";
import { useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { decodeUrl, encodeUrl } from "@/lib/tools/url";

type Mode = "encode" | "decode";

export function UrlCodec() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output =
    mode === "encode"
      ? { ok: true as const, value: encodeUrl(input).value }
      : decodeUrl(input);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`border px-2 py-0.5 ${mode === m ? "border-accent text-accent" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>
      <label className="block text-xs text-muted">
        input
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <TerminalCard label="output">
        {output.ok ? (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">
              {output.value || <span className="text-muted">(empty)</span>}
            </pre>
            {output.value && <CopyButton value={output.value} />}
          </div>
        ) : (
          <span className="text-muted">error: {output.error}</span>
        )}
      </TerminalCard>
    </div>
  );
}
```

- [ ] **Step 2.5: Register in `content/tools.ts`**

Import: `import { UrlCodec } from "@/components/tools/UrlCodec";`
Entry:
```ts
{
  slug: "url-codec",
  name: "url codec",
  description: "percent-encode and decode URL components.",
  category: "dev",
  keywords: ["url", "encode", "decode", "percent", "encodeURIComponent"],
  component: UrlCodec,
},
```

- [ ] **Step 2.6: Verify + commit**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/url.ts tests/unit/lib/tools/url.test.ts components/tools/UrlCodec.tsx content/tools.ts
git commit -m "feat(tools): url encode/decode"
```

---

## Task 3: UUID generator

**Files:**
- Create: `lib/tools/uuid.ts`
- Create: `tests/unit/lib/tools/uuid.test.ts`
- Create: `components/tools/Uuid.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 3.1: Tests**

`tests/unit/lib/tools/uuid.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateUuid } from "@/lib/tools/uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuid", () => {
  it("v4 returns a valid UUIDv4", () => {
    expect(generateUuid("v4")).toMatch(V4);
  });
  it("v7 returns a valid UUIDv7 layout", () => {
    expect(generateUuid("v7")).toMatch(V7);
  });
  it("v4 calls are unique", () => {
    const s = new Set(Array.from({ length: 50 }, () => generateUuid("v4")));
    expect(s.size).toBe(50);
  });
  it("v7 is monotonic (or at least distinct)", () => {
    const a = generateUuid("v7");
    const b = generateUuid("v7");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 3.2: Implement `lib/tools/uuid.ts`**

```ts
export type UuidVersion = "v4" | "v7";

export function generateUuid(version: UuidVersion): string {
  if (version === "v4") return crypto.randomUUID();
  return generateV7();
}

function generateV7(): string {
  const ts = Date.now();
  const tsHex = ts.toString(16).padStart(12, "0");
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  rand[0] = (rand[0] & 0x0f) | 0x70;
  rand[2] = (rand[2] & 0x3f) | 0x80;
  const hex = (b: number) => b.toString(16).padStart(2, "0");
  return [
    tsHex.slice(0, 8),
    tsHex.slice(8, 12),
    hex(rand[0]) + hex(rand[1]),
    hex(rand[2]) + hex(rand[3]),
    rand.slice(4).reduce((s, b) => s + hex(b), ""),
  ].join("-");
}
```

- [ ] **Step 3.3: `components/tools/Uuid.tsx`**

```tsx
"use client";
import { useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { type UuidVersion, generateUuid } from "@/lib/tools/uuid";

export function Uuid() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    setUuids(Array.from({ length: count }, () => generateUuid(version)));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs items-center flex-wrap">
        <span className="text-muted">version:</span>
        {(["v4", "v7"] as UuidVersion[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVersion(v)}
            className={`border px-2 py-0.5 ${version === v ? "border-accent text-accent" : ""}`}
          >
            {v}
          </button>
        ))}
        <span className="text-muted ml-4">count:</span>
        {[1, 5, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            className={`border px-2 py-0.5 ${count === n ? "border-accent text-accent" : ""}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={generate}
          className="border px-3 py-0.5 border-accent text-accent ml-auto"
        >
          generate
        </button>
      </div>
      <TerminalCard label="output">
        {uuids.length === 0 ? (
          <span className="text-muted">click generate.</span>
        ) : (
          <div className="flex items-start gap-2">
            <pre className="flex-1 whitespace-pre-wrap break-all">{uuids.join("\n")}</pre>
            <CopyButton value={uuids.join("\n")} />
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
```

- [ ] **Step 3.4: Register + commit**

Import: `import { Uuid } from "@/components/tools/Uuid";`
Entry:
```ts
{
  slug: "uuid",
  name: "uuid",
  description: "generate UUIDs (v4 random, v7 time-ordered).",
  category: "dev",
  keywords: ["uuid", "guid", "v4", "v7", "random", "identifier"],
  component: Uuid,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/uuid.ts tests/unit/lib/tools/uuid.test.ts components/tools/Uuid.tsx content/tools.ts
git commit -m "feat(tools): uuid generator (v4 + v7)"
```

---

## Task 4: JWT decoder (client-side, no verify)

**Files:**
- Create: `lib/tools/jwt.ts`
- Create: `tests/unit/lib/tools/jwt.test.ts`
- Create: `components/tools/Jwt.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 4.1: Tests**

`tests/unit/lib/tools/jwt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decodeJwt } from "@/lib/tools/jwt";

const VALID =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes a valid JWT", () => {
    const r = decodeJwt(VALID);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(r.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
      expect(r.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    }
  });
  it("errors on wrong segment count", () => {
    expect(decodeJwt("a.b").ok).toBe(false);
    expect(decodeJwt("just-one-segment").ok).toBe(false);
  });
  it("errors on non-JSON payload", () => {
    expect(decodeJwt("Zm9v.YmFy.sig").ok).toBe(false);
  });
  it("handles empty input", () => {
    expect(decodeJwt("").ok).toBe(false);
  });
});
```

- [ ] **Step 4.2: Implement `lib/tools/jwt.ts`**

```ts
type Json = Record<string, unknown>;

export type JwtResult =
  | { ok: true; header: Json; payload: Json; signature: string }
  | { ok: false; error: string };

function b64urlDecodeToString(seg: string): string {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function decodeJwt(input: string): JwtResult {
  const parts = input.trim().split(".");
  if (parts.length !== 3) return { ok: false, error: "expected 3 segments separated by '.'" };
  try {
    const header = JSON.parse(b64urlDecodeToString(parts[0])) as Json;
    const payload = JSON.parse(b64urlDecodeToString(parts[1])) as Json;
    return { ok: true, header, payload, signature: parts[2] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "decode failed" };
  }
}
```

- [ ] **Step 4.3: `components/tools/Jwt.tsx`**

```tsx
"use client";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { decodeJwt } from "@/lib/tools/jwt";

export function Jwt() {
  const [input, setInput] = useState("");
  const result = input.trim() === "" ? null : decodeJwt(input);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        decoded client-side. this tool does not verify signatures.
      </p>
      <label className="block text-xs text-muted">
        token
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      {result && result.ok && (
        <>
          <TerminalCard label="header">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(result.header, null, 2)}
            </pre>
          </TerminalCard>
          <TerminalCard label="payload">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </TerminalCard>
          <TerminalCard label="signature">
            <pre className="whitespace-pre-wrap break-all">{result.signature}</pre>
          </TerminalCard>
        </>
      )}
      {result && !result.ok && (
        <TerminalCard label="error">
          <span className="text-muted">{result.error}</span>
        </TerminalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 4.4: Register + commit**

Import: `import { Jwt } from "@/components/tools/Jwt";`
Entry:
```ts
{
  slug: "jwt",
  name: "jwt decoder",
  description: "decode JWT header and payload client-side. no signature verification.",
  category: "dev",
  keywords: ["jwt", "decode", "token", "bearer", "auth"],
  component: Jwt,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/jwt.ts tests/unit/lib/tools/jwt.test.ts components/tools/Jwt.tsx content/tools.ts
git commit -m "feat(tools): jwt decoder (client-side, no verify)"
```

---

## Task 5: User Agent parser

**Files:**
- Create: `lib/tools/userAgent.ts`
- Create: `tests/unit/lib/tools/userAgent.test.ts`
- Create: `components/tools/UserAgent.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 5.1: Install ua-parser-js**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm add ua-parser-js
```

- [ ] **Step 5.2: Tests**

`tests/unit/lib/tools/userAgent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/tools/userAgent";

describe("parseUserAgent", () => {
  it("parses Chrome on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const r = parseUserAgent(ua);
    expect(r.browser.name).toBe("Chrome");
    expect(r.os.name).toBe("macOS");
  });
  it("parses an iPhone Safari UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
    const r = parseUserAgent(ua);
    expect(r.browser.name).toMatch(/Safari|Mobile Safari/);
    expect(r.device.type).toBe("mobile");
  });
  it("handles unknown UA gracefully", () => {
    const r = parseUserAgent("weird-bot/0.1");
    expect(r.browser.name ?? "").toBeDefined();
  });
});
```

- [ ] **Step 5.3: Implement `lib/tools/userAgent.ts`**

```ts
import { UAParser } from "ua-parser-js";

export type UaResult = {
  browser: { name?: string; version?: string };
  os: { name?: string; version?: string };
  device: { vendor?: string; model?: string; type?: string };
  engine: { name?: string; version?: string };
};

export function parseUserAgent(ua: string): UaResult {
  const parser = new UAParser(ua);
  const r = parser.getResult();
  return {
    browser: { name: r.browser.name, version: r.browser.version },
    os: { name: r.os.name, version: r.os.version },
    device: { vendor: r.device.vendor, model: r.device.model, type: r.device.type ?? "desktop" },
    engine: { name: r.engine.name, version: r.engine.version },
  };
}
```

- [ ] **Step 5.4: `components/tools/UserAgent.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { parseUserAgent } from "@/lib/tools/userAgent";

export function UserAgent() {
  const [ua, setUa] = useState("");

  useEffect(() => {
    setUa(navigator.userAgent);
  }, []);

  const parsed = ua ? parseUserAgent(ua) : null;

  return (
    <div className="space-y-4">
      <label className="block text-xs text-muted">
        user agent
        <textarea
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          rows={3}
          spellCheck={false}
          className="block w-full mt-1 border bg-bg text-fg p-2 text-sm font-mono"
        />
      </label>
      <div className="flex gap-2">
        {ua && <CopyButton value={ua} />}
      </div>
      {parsed && (
        <TerminalCard label="parsed">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">browser</dt>
            <dd>{parsed.browser.name ?? "?"} {parsed.browser.version ?? ""}</dd>
            <dt className="text-muted">engine</dt>
            <dd>{parsed.engine.name ?? "?"} {parsed.engine.version ?? ""}</dd>
            <dt className="text-muted">os</dt>
            <dd>{parsed.os.name ?? "?"} {parsed.os.version ?? ""}</dd>
            <dt className="text-muted">device</dt>
            <dd>{[parsed.device.vendor, parsed.device.model, parsed.device.type].filter(Boolean).join(" · ") || "desktop"}</dd>
          </dl>
        </TerminalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 5.5: Register + commit**

Import: `import { UserAgent } from "@/components/tools/UserAgent";`
Entry:
```ts
{
  slug: "user-agent",
  name: "user agent",
  description: "parse your browser's user agent string (browser, os, device, engine).",
  category: "network",
  keywords: ["user agent", "ua", "browser", "os", "device"],
  component: UserAgent,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/userAgent.ts tests/unit/lib/tools/userAgent.test.ts components/tools/UserAgent.tsx content/tools.ts package.json pnpm-lock.yaml
git commit -m "feat(tools): user agent parser"
```

---

## Task 6: What-is-my-IP (server component + refresh API)

**Files:**
- Create: `app/api/whoami/route.ts`
- Create: `components/tools/WhatIsMyIp.tsx` (server component + small client fragment for refresh)
- Modify: `content/tools.ts`

- [ ] **Step 6.1: Create the `/api/whoami` route**

`app/api/whoami/route.ts`:

```ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export type WhoamiResponse = {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
};

export async function GET() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || null;

  const payload: WhoamiResponse = {
    ip,
    country: h.get("x-vercel-ip-country"),
    city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city") ?? "") : null,
    region: h.get("x-vercel-ip-country-region"),
    latitude: h.get("x-vercel-ip-latitude"),
    longitude: h.get("x-vercel-ip-longitude"),
    timezone: h.get("x-vercel-ip-timezone"),
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 6.2: Component with server read + client refresh**

`components/tools/WhatIsMyIp.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import type { WhoamiResponse } from "@/app/api/whoami/route";

export function WhatIsMyIp() {
  const [data, setData] = useState<WhoamiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/whoami", { cache: "no-store" });
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={load} className="border px-2 py-0.5">
          refresh
        </button>
        {data?.ip && <CopyButton value={data.ip} />}
      </div>
      <TerminalCard label="your ip">
        {loading && !data ? (
          <span className="text-muted">looking up...</span>
        ) : data?.ip ? (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">ip</dt>
            <dd className="break-all">{data.ip}</dd>
            <dt className="text-muted">city</dt>
            <dd>{[data.city, data.region, data.country].filter(Boolean).join(", ") || "unknown"}</dd>
            <dt className="text-muted">coords</dt>
            <dd>{data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "unknown"}</dd>
            <dt className="text-muted">timezone</dt>
            <dd>{data.timezone ?? "unknown"}</dd>
          </dl>
        ) : (
          <span className="text-muted">could not determine your IP (running behind a proxy or on localhost)</span>
        )}
      </TerminalCard>
    </div>
  );
}
```

- [ ] **Step 6.3: Register + commit**

Import: `import { WhatIsMyIp } from "@/components/tools/WhatIsMyIp";`
Entry:
```ts
{
  slug: "ip",
  name: "what is my ip",
  description: "your public ip address, location, and timezone.",
  category: "network",
  keywords: ["ip", "ipv4", "ipv6", "location", "geoip", "whatsmyip"],
  component: WhatIsMyIp,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add app/api/whoami/route.ts components/tools/WhatIsMyIp.tsx content/tools.ts
git commit -m "feat(tools): what-is-my-ip (edge headers)"
```

---

## Task 7: HTTP headers inspector

**Files:**
- Create: `components/tools/Headers.tsx`
- Modify: `content/tools.ts`

Note: this one is simpler — reads the current request's headers directly via a server component. No API route needed.

- [ ] **Step 7.1: Create `app/api/whoami/route.ts` sibling for headers**

Create `app/api/headers/route.ts`:

```ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const h = await headers();
  const entries: [string, string][] = [];
  h.forEach((v, k) => entries.push([k, v]));
  entries.sort(([a], [b]) => a.localeCompare(b));
  return NextResponse.json({ headers: entries }, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 7.2: Client component for the tool page**

`components/tools/Headers.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/terminal/CopyButton";
import { TerminalCard } from "@/components/terminal/TerminalCard";

export function Headers() {
  const [rows, setRows] = useState<[string, string][] | null>(null);

  useEffect(() => {
    fetch("/api/headers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.headers as [string, string][]));
  }, []);

  const asText = rows ? rows.map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {asText && <CopyButton value={asText} />}
      </div>
      <TerminalCard label="request headers">
        {!rows ? (
          <span className="text-muted">loading...</span>
        ) : (
          <dl className="grid grid-cols-[min-content_1fr] gap-x-4 gap-y-1 text-xs">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted whitespace-nowrap">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </TerminalCard>
    </div>
  );
}
```

- [ ] **Step 7.3: Register + commit**

Import: `import { Headers } from "@/components/tools/Headers";`
Entry:
```ts
{
  slug: "headers",
  name: "http headers",
  description: "inspect the http request headers your browser sends.",
  category: "network",
  keywords: ["http", "headers", "request", "user-agent", "accept"],
  component: Headers,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add app/api/headers/route.ts components/tools/Headers.tsx content/tools.ts
git commit -m "feat(tools): http headers inspector"
```

---

## Task 8: IP lookup (ipinfo.io proxy)

**Files:**
- Create: `lib/tools/ipLookup.ts`
- Create: `tests/unit/lib/tools/ipLookup.test.ts`
- Create: `app/api/ip-lookup/route.ts`
- Create: `components/tools/IpLookup.tsx`
- Modify: `content/tools.ts`
- Modify: `.env.example`

- [ ] **Step 8.1: Add env var to `.env.example`**

Append line:
```
IPINFO_TOKEN=
```

- [ ] **Step 8.2: Tests for the pure lib**

`tests/unit/lib/tools/ipLookup.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupIp } from "@/lib/tools/ipLookup";

describe("lookupIp", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects obviously invalid IPs without calling the API", async () => {
    const spy = vi.fn();
    global.fetch = spy as unknown as typeof fetch;
    const r = await lookupIp("not-an-ip", "test-token");
    expect(r.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns parsed data on 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ip: "8.8.8.8",
        city: "Mountain View",
        region: "California",
        country: "US",
        loc: "37.4056,-122.0775",
        org: "AS15169 Google LLC",
        timezone: "America/Los_Angeles",
      }),
    }) as unknown as typeof fetch;
    const r = await lookupIp("8.8.8.8", "test-token");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.ip).toBe("8.8.8.8");
      expect(r.data.city).toBe("Mountain View");
      expect(r.data.org).toContain("Google");
    }
  });

  it("returns error on non-ok fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    }) as unknown as typeof fetch;
    const r = await lookupIp("8.8.8.8", "test-token");
    expect(r.ok).toBe(false);
  });

  it("errors without a token", async () => {
    const r = await lookupIp("8.8.8.8", "");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 8.3: Implement `lib/tools/ipLookup.ts`**

```ts
export type IpInfo = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  timezone?: string;
};

export type IpLookupResult = { ok: true; data: IpInfo } | { ok: false; error: string };

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

export async function lookupIp(ip: string, token: string): Promise<IpLookupResult> {
  const trimmed = ip.trim();
  if (!trimmed) return { ok: false, error: "ip required" };
  if (!IPV4.test(trimmed) && !IPV6.test(trimmed)) return { ok: false, error: "invalid ip format" };
  if (!token) return { ok: false, error: "ipinfo token not configured" };

  const res = await fetch(`https://ipinfo.io/${trimmed}?token=${token}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return { ok: false, error: `upstream error: ${res.status}` };
  const data = (await res.json()) as IpInfo;
  return { ok: true, data };
}
```

- [ ] **Step 8.4: API route**

`app/api/ip-lookup/route.ts`:

```ts
import { NextResponse } from "next/server";
import { lookupIp } from "@/lib/tools/ipLookup";

export const runtime = "edge";

export async function GET(req: Request) {
  const ip = new URL(req.url).searchParams.get("ip") ?? "";
  const token = process.env.IPINFO_TOKEN ?? "";
  const r = await lookupIp(ip, token);
  const status = r.ok ? 200 : 400;
  return NextResponse.json(r, {
    status,
    headers: r.ok
      ? { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
      : { "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 8.5: UI component**

`components/tools/IpLookup.tsx`:

```tsx
"use client";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import type { IpLookupResult } from "@/lib/tools/ipLookup";

export function IpLookup() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IpLookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2 text-sm">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="8.8.8.8"
          spellCheck={false}
          className="flex-1 border bg-bg text-fg p-2 font-mono"
        />
        <button type="submit" disabled={loading} className="border px-3 py-1">
          {loading ? "looking..." : "lookup"}
        </button>
      </form>
      {result?.ok && (
        <TerminalCard label={`details · ${result.data.ip}`}>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
            <dt className="text-muted">city</dt>
            <dd>
              {[result.data.city, result.data.region, result.data.country].filter(Boolean).join(", ") || "unknown"}
            </dd>
            <dt className="text-muted">coords</dt>
            <dd>{result.data.loc ?? "unknown"}</dd>
            <dt className="text-muted">asn / isp</dt>
            <dd>{result.data.org ?? "unknown"}</dd>
            <dt className="text-muted">timezone</dt>
            <dd>{result.data.timezone ?? "unknown"}</dd>
          </dl>
        </TerminalCard>
      )}
      {result && !result.ok && (
        <TerminalCard label="error">
          <span className="text-muted">{result.error}</span>
        </TerminalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 8.6: Register + commit**

Import: `import { IpLookup } from "@/components/tools/IpLookup";`
Entry:
```ts
{
  slug: "ip-lookup",
  name: "ip lookup",
  description: "look up any IP's geolocation, ASN, and ISP (via ipinfo.io).",
  category: "network",
  keywords: ["ip", "lookup", "geoip", "asn", "isp", "ipinfo"],
  component: IpLookup,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/ipLookup.ts tests/unit/lib/tools/ipLookup.test.ts app/api/ip-lookup/route.ts components/tools/IpLookup.tsx content/tools.ts .env.example
git commit -m "feat(tools): ip lookup via ipinfo.io"
```

---

## Task 9: DNS lookup (Cloudflare DoH)

**Files:**
- Create: `lib/tools/dns.ts`
- Create: `tests/unit/lib/tools/dns.test.ts`
- Create: `app/api/dns/route.ts`
- Create: `components/tools/Dns.tsx`
- Modify: `content/tools.ts`

- [ ] **Step 9.1: Tests**

`tests/unit/lib/tools/dns.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDns } from "@/lib/tools/dns";

describe("resolveDns", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects invalid domain names", async () => {
    const r = await resolveDns("", "A");
    expect(r.ok).toBe(false);
  });

  it("rejects unsupported record types", async () => {
    const r = await resolveDns("example.com", "BOGUS" as unknown as "A");
    expect(r.ok).toBe(false);
  });

  it("returns parsed answers on valid response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      }),
    }) as unknown as typeof fetch;
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toHaveLength(1);
      expect(r.answers[0].data).toBe("93.184.216.34");
    }
  });

  it("returns error when upstream fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;
    const r = await resolveDns("example.com", "A");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 9.2: Implement `lib/tools/dns.ts`**

```ts
export const DNS_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] as const;
export type DnsType = (typeof DNS_TYPES)[number];

export type DnsAnswer = { name: string; type: number; TTL: number; data: string };
export type DnsResult =
  | { ok: true; answers: DnsAnswer[] }
  | { ok: false; error: string };

const DOMAIN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export async function resolveDns(domain: string, type: DnsType): Promise<DnsResult> {
  const d = domain.trim().toLowerCase();
  if (!DOMAIN.test(d)) return { ok: false, error: "invalid domain" };
  if (!DNS_TYPES.includes(type)) return { ok: false, error: "unsupported record type" };

  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${type}`,
    { headers: { Accept: "application/dns-json" } },
  );
  if (!res.ok) return { ok: false, error: `upstream error: ${res.status}` };
  const data = (await res.json()) as { Status: number; Answer?: DnsAnswer[] };
  if (data.Status !== 0) return { ok: false, error: `dns status ${data.Status}` };
  return { ok: true, answers: data.Answer ?? [] };
}
```

- [ ] **Step 9.3: API route**

`app/api/dns/route.ts`:

```ts
import { NextResponse } from "next/server";
import { DNS_TYPES, type DnsType, resolveDns } from "@/lib/tools/dns";

export const runtime = "edge";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = params.get("name") ?? "";
  const typeRaw = params.get("type") ?? "A";
  const type = (DNS_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as DnsType) : ("A" as DnsType);
  const r = await resolveDns(name, type);
  return NextResponse.json(r, {
    status: r.ok ? 200 : 400,
    headers: r.ok
      ? { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      : { "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 9.4: UI component**

`components/tools/Dns.tsx`:

```tsx
"use client";
import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { DNS_TYPES, type DnsResult, type DnsType } from "@/lib/tools/dns";

export function Dns() {
  const [name, setName] = useState("");
  const [type, setType] = useState<DnsType>("A");
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/dns?name=${encodeURIComponent(name)}&type=${type}`);
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2 text-sm flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          className="flex-1 min-w-[12rem] border bg-bg text-fg p-2 font-mono"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DnsType)}
          className="border bg-bg text-fg p-2 font-mono"
        >
          {DNS_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="border px-3 py-1">
          {loading ? "..." : "resolve"}
        </button>
      </form>
      {result?.ok && (
        <TerminalCard label={`${type} records · ${name}`}>
          {result.answers.length === 0 ? (
            <span className="text-muted">no records</span>
          ) : (
            <ul className="space-y-1 text-sm list-none p-0">
              {result.answers.map((a, i) => (
                <li key={`${a.name}-${a.data}-${i}`} className="break-all">
                  <span className="text-muted">TTL {a.TTL}s · </span>
                  {a.data}
                </li>
              ))}
            </ul>
          )}
        </TerminalCard>
      )}
      {result && !result.ok && (
        <TerminalCard label="error">
          <span className="text-muted">{result.error}</span>
        </TerminalCard>
      )}
    </div>
  );
}
```

- [ ] **Step 9.5: Register + commit**

Import: `import { Dns } from "@/components/tools/Dns";`
Entry:
```ts
{
  slug: "dns",
  name: "dns lookup",
  description: "resolve A, AAAA, MX, TXT, NS, or CNAME records via Cloudflare DoH.",
  category: "network",
  keywords: ["dns", "lookup", "record", "A", "AAAA", "MX", "TXT", "cloudflare"],
  component: Dns,
},
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add lib/tools/dns.ts tests/unit/lib/tools/dns.test.ts app/api/dns/route.ts components/tools/Dns.tsx content/tools.ts
git commit -m "feat(tools): dns lookup via cloudflare DoH"
```

---

## Task 10: E2E coverage for new tools

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 10.1: Extend the smoke suite**

Add to the end of `tests/e2e/smoke.spec.ts`:

```ts
test("home lists all 10 tools", async ({ page }) => {
  await page.goto("/");
  for (const slug of ["ip", "ip-lookup", "user-agent", "headers", "dns", "json", "base64", "url-codec", "jwt", "uuid"]) {
    await expect(page.locator(`a[href="/tools/${slug}"]`)).toBeVisible();
  }
});

test("json formatter formats valid input", async ({ page }) => {
  await page.goto("/tools/json");
  await page.getByLabel("input").fill('{"a":1}');
  await expect(page.locator("pre")).toContainText('"a": 1');
});

test("url codec round-trips", async ({ page }) => {
  await page.goto("/tools/url-codec");
  await page.getByLabel("input").fill("hello world");
  await expect(page.locator("pre")).toContainText("hello%20world");
});

test("uuid generator produces a v4 uuid", async ({ page }) => {
  await page.goto("/tools/uuid");
  await page.getByRole("button", { name: "generate" }).click();
  await expect(page.locator("pre")).toHaveText(
    /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/,
  );
});

test("jwt decoder shows header and payload for a valid token", async ({ page }) => {
  await page.goto("/tools/jwt");
  await page.getByLabel("token").fill(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig",
  );
  await expect(page.locator("pre").first()).toContainText("HS256");
  await expect(page.locator("pre")).toContainText('"sub": "1"');
});

test("user agent tool parses navigator.userAgent", async ({ page }) => {
  await page.goto("/tools/user-agent");
  await expect(page.getByLabel("user agent")).not.toHaveValue("");
});
```

- [ ] **Step 10.2: Run**

```bash
pnpm test:e2e
```
Expected: 9 tests passed (3 existing + 6 new). If any fails, debug.

- [ ] **Step 10.3: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(e2e): coverage for 9 new tools"
```

---

## Task 11: Final verification + tag

- [ ] **Step 11.1: Full verification**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm install
pnpm lint
pnpm typecheck
pnpm test       # expected: 6 initial + 6 new libs = 12+ test files, all green
pnpm build      # expected: home + 10 tool routes + legal + api routes
pnpm test:e2e   # expected: ~9 tests pass
```

All must pass.

- [ ] **Step 11.2: Manual smoke on dev**

```bash
pnpm dev
```

Visit each tool and confirm UI renders:
- `/tools/ip`, `/tools/ip-lookup`, `/tools/user-agent`, `/tools/headers`, `/tools/dns` (all 5 network tools)
- `/tools/base64`, `/tools/json`, `/tools/url-codec`, `/tools/jwt`, `/tools/uuid` (all 5 dev utilities)
- Home shows all 10 under their categories

Kill dev server when done.

- [ ] **Step 11.3: Tag**

```bash
git tag -a plan-2-complete -m "drwho.me v1 tool suite complete: 10 tools"
```

---

## Done when

- 10 tools live under `/tools/*`
- Home grid shows both categories, all 10 cards
- All unit tests pass (12+ test files)
- All 9 E2E tests pass
- `pnpm build` succeeds; every `/tools/<slug>` prerendered as SSG (●)
- Tag `plan-2-complete` placed

## Next

**Plan 3** (content + full SEO): blog MDX pipeline, 5 launch posts, sitemap.xml + robots.txt generator, dynamic OG images via `next/og`, JSON-LD per page, Lighthouse CI gate (≥95).

**Plan 4** (MCP): `@vercel/mcp-adapter` endpoint + paywall stub + `/mcp` landing page + waitlist.

**Plan 5** (monetization): AdSense script wiring + consent banner (if needed) + affiliate activation on IP/DNS/JWT pages.
