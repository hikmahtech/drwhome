# drwho.me — Plan 4: MCP endpoint + paywall stub + /mcp landing + waitlist

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reserve the MCP namespace on `drwho.me` with a working remote MCP endpoint that advertises every MCP-compatible tool (from the existing `content/tools.ts` registry) via Streamable HTTP, returns a paywall (HTTP 402 + JSON-RPC error `-32001`) on every `tools/call`, and ships a public `/mcp` landing page with a waitlist form that writes to Vercel KV and emails a notification via Resend.

**Architecture:** Three orthogonal concerns:

1. **MCP namespace** — `app/mcp/[transport]/route.ts` uses `mcp-handler` (the current name of the package the spec calls `@vercel/mcp-adapter`). Tool metadata and paid-tier-ready handlers live in `lib/mcp/tools.ts`, keyed by slug. Tool handlers import the same pure functions from `lib/tools/*.ts` that the web UI uses — no logic duplication. `content/tools.ts` gains one new optional field, `mcpName?: string`, that marks MCP-compatible tools and points at the matching entry in `lib/mcp/tools.ts`. Zod stays entirely in `lib/mcp/*` so it never reaches the client bundle.

2. **Paywall stub** — `lib/mcp/paywall.ts` exports a higher-order route wrapper `withPaywall(inner)` that peeks at incoming JSON-RPC bodies and short-circuits `tools/call` with `{jsonrpc:"2.0", id, error:{code:-32001, message:"...", data:{upgradeUrl:"https://drwho.me/mcp", tier:"paid"}}}` and HTTP 402. `initialize`, `tools/list`, and all non-tool JSON-RPC methods pass through to the underlying mcp-handler handler. Plan 6 swaps `withPaywall` for `withStripeBilling` with the same signature.

3. **Landing + waitlist** — `app/mcp/page.tsx` auto-generates a copyable Claude Desktop / ChatGPT config pointing at `https://drwho.me/mcp/mcp`, lists every MCP-compatible tool from `lib/mcp/tools.ts`, and renders a waitlist form. `app/mcp/actions.ts` (Next.js server action) validates the email, checks a honeypot, writes `{email, notes, createdAt}` to a Vercel KV list `waitlist:mcp`, and sends a Resend notification to `CONTACT_TO_EMAIL`. Pure validation logic is split into `lib/waitlist.ts` (tested without mocks) from the action (tested with mocked KV + Resend).

**Tech Stack:** Plan 3 stack + `mcp-handler@^1` + `@modelcontextprotocol/sdk@^1` + `zod@^3` (adapter peer) + `@vercel/kv@^3`. `resend` is already installed (Plan 1).

**Reference spec:** `docs/superpowers/specs/2026-04-16-drwho-me-design.md` §4.3, §6.6, §8.5.
**Built on:** Plan 3 (`docs/superpowers/plans/2026-04-18-drwho-03-content-seo.md`, tagged `plan-3-complete`).

**Out of scope (covered later):**
- Real Stripe billing + API key issuance + metering (Plan 6 swaps `withPaywall`)
- AdSense script + consent banner + affiliate activation (Plan 5)
- MCP directory submissions (Smithery, anthropic's listing) — post-deploy ops, not code
- A fancier `/mcp` URL without the `/[transport]` segment — the mcp-handler adapter requires a dynamic `[transport]` segment; the clean `https://drwho.me/mcp/mcp` URL is the cost of using the adapter. A flat `/mcp` would require implementing the MCP Streamable HTTP protocol directly; the adapter is the shorter path and the spec requests it explicitly

---

## Invariants reaffirmed (from CLAUDE.md + prior lessons)

- `content/tools.ts` stays the single source of truth for tool presence. It gains one narrow field (`mcpName?`) that marks a tool as MCP-compatible. MCP schemas + handlers live in `lib/mcp/tools.ts` so zod and `@modelcontextprotocol/sdk` never reach client bundles.
- Tool logic is not duplicated. MCP handlers import from `lib/tools/*.ts` — the same functions the UI uses.
- MCP tool names use underscores per the design spec (`ip_lookup`, `dns_lookup`, `json_format`, `base64_encode`, `base64_decode`, `url_encode`, `url_decode`, `jwt_decode`, `uuid_generate`, `user_agent_parse`). The `/tools/[slug]` URL stays dash-separated (`ip-lookup`, `dns`, etc.) — these are distinct name spaces.
- Browser-only tools (`ip`, `headers`) are intentionally NOT MCP-exposed — they're scoped to the web request. They leave `mcpName` undefined and get skipped by registration.
- Dynamic `params` in Next.js 15 App Router is `Promise<{...}>` — always `await`. (Prior lesson f388fde4.)
- `typedRoutes: true` validates every `<Link href>` at build. If we add `/mcp` to Nav, `app/mcp/page.tsx` must exist in the same commit. (Prior lesson bb6d1154.)
- Never hardcode secrets — env vars only (CLAUDE.md). New env vars get documented in `README.md` in the same task that introduces them.

---

## File Structure

**Created or modified by Plan 4:**

```
drwho/
├── app/
│   └── mcp/
│       ├── [transport]/
│       │   └── route.ts                  # NEW — MCP handler, paywalled
│       ├── actions.ts                    # NEW — waitlist server action
│       ├── page.tsx                      # NEW — /mcp landing + waitlist form
│       └── WaitlistForm.tsx              # NEW — client component for the form
├── components/
│   └── layout/
│       └── Nav.tsx                       # MODIFIED — add /mcp link
├── content/
│   └── tools.ts                          # MODIFIED — add `mcpName?: string` pointer per tool
├── lib/
│   ├── mcp/
│   │   ├── tools.ts                      # NEW — MCP metadata + handlers (imports lib/tools/*)
│   │   ├── server.ts                     # NEW — registers tools with an mcp-handler server
│   │   └── paywall.ts                    # NEW — withPaywall higher-order route wrapper
│   └── waitlist.ts                       # NEW — pure validation + record shaping
├── tests/
│   ├── unit/
│   │   ├── app/
│   │   │   └── mcp/
│   │   │       └── actions.test.ts       # NEW — waitlist server action with mocked KV/Resend
│   │   └── lib/
│   │       ├── mcp/
│   │       │   ├── paywall.test.ts       # NEW
│   │       │   ├── tools.test.ts         # NEW
│   │       │   └── server.test.ts        # NEW
│   │       └── waitlist.test.ts          # NEW
│   └── e2e/
│       └── mcp.spec.ts                   # NEW — MCP JSON-RPC + /mcp landing + waitlist
├── package.json                          # MODIFIED — new deps
├── README.md                             # MODIFIED — env vars + `/mcp` URL
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-04-18-drwho-04-mcp-endpoint.md   # THIS FILE
```

No changes to existing tool logic (`lib/tools/*`), tool components (`components/tools/*`), or the blog (`app/blog/*`, `content/posts/*`).

---

## Dependency budget

Adding:

| Package | Why | Scope |
|---|---|---|
| `mcp-handler` | current name of `@vercel/mcp-adapter`, Streamable HTTP + SSE Next.js adapter | server-only (Node runtime on `/mcp/[transport]`) |
| `@modelcontextprotocol/sdk` | peer of `mcp-handler`; `McpError` + types | server-only |
| `zod` (pin `^3`, not `^4`) | peer of `mcp-handler`; input schemas | server-only (imported from `lib/mcp/*`) |
| `@vercel/kv` | waitlist storage | server-only (imported from `app/mcp/actions.ts`) |

Zero-additional-client-bundle-cost constraint: `content/tools.ts` is imported by client components (the home grid + tool pages). Therefore `content/tools.ts` **must not** transitively import `zod`, `mcp-handler`, or `@vercel/kv`. All four of those stay behind the `lib/mcp/*` and `app/mcp/*` walls.

---

## Environment variables (new)

Set in Vercel dashboard; documented in `README.md` in Task 10:

| Name | Required by | Purpose |
|---|---|---|
| `KV_REST_API_URL` | `@vercel/kv` | Vercel KV REST endpoint (provided automatically when KV is attached to the project) |
| `KV_REST_API_TOKEN` | `@vercel/kv` | Vercel KV REST auth token (same) |

Reused from prior plans: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (both already present for the Plan 1 contact form).

Local dev: if KV env vars are unset, the waitlist action returns an `ok: false, error: "waitlist temporarily unavailable"` — matches the existing contact-form pattern and avoids a hard crash during `pnpm dev` without a KV attached.

---

## Task 1: Install dependencies + verify adapter API shape

**Goal:** Install `mcp-handler`, `@modelcontextprotocol/sdk`, `zod@^3`, and `@vercel/kv`. No code yet — just deps + a short probe to confirm the adapter exports the names we expect. This commit is bisect-safe (no behavior change).

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1.1: Install runtime peers**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pnpm add mcp-handler @modelcontextprotocol/sdk zod@^3 @vercel/kv
```

Expected: `package.json` gains four `dependencies` entries. pnpm-lock.yaml updates. No errors.

- [ ] **Step 1.2: Confirm the adapter exports `createMcpHandler`**

```bash
node -e "const m = require('mcp-handler'); console.log(Object.keys(m).sort())"
```

Expected output contains `createMcpHandler`. If the symbol name differs (package changed its API), stop and update the plan before continuing — subsequent tasks hard-code `createMcpHandler`.

- [ ] **Step 1.3: Confirm `@modelcontextprotocol/sdk` exports `McpError`**

```bash
node -e "const s = require('@modelcontextprotocol/sdk/types.js'); console.log('McpError' in s)"
```

Expected: `true`.

- [ ] **Step 1.4: Confirm nothing else broke**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All green. (No code changed yet; this catches any peer-dep version conflicts the install introduced.)

- [ ] **Step 1.5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add mcp-handler, @modelcontextprotocol/sdk, zod, @vercel/kv"
```

---

## Task 2: `lib/mcp/paywall.ts` — higher-order route wrapper (pure, TDD)

**Goal:** A pure function `withPaywall(inner)` that returns a new Next.js route handler. The returned handler:
1. On `POST` with a JSON-RPC body whose `method === "tools/call"`: returns HTTP 402 with `{jsonrpc:"2.0", id, error:{code:-32001, message, data:{upgradeUrl, tier:"paid"}}}`.
2. Otherwise: delegates to `inner(req, ctx)`.

This is the **only** place the paywall logic lives. Plan 6 replaces this file's implementation with real billing; the signature stays identical so route wiring doesn't change.

**Files:**
- Create: `lib/mcp/paywall.ts`
- Create: `tests/unit/lib/mcp/paywall.test.ts`

- [ ] **Step 2.1: Write the failing tests**

`tests/unit/lib/mcp/paywall.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { withPaywall } from "@/lib/mcp/paywall";

function jsonRequest(body: unknown): Request {
  return new Request("https://drwho.me/mcp/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("withPaywall", () => {
  it("short-circuits tools/call with 402 + JSON-RPC -32001", async () => {
    const inner = vi.fn(async () => new Response("should not run", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      id: 42,
      method: "tools/call",
      params: { name: "uuid_generate", arguments: {} },
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(42);
    expect(body.error.code).toBe(-32001);
    expect(body.error.message).toMatch(/subscription/i);
    expect(body.error.data).toEqual({ upgradeUrl: "https://drwho.me/mcp", tier: "paid" });
    expect(inner).not.toHaveBeenCalled();
  });

  it("forwards tools/list to the inner handler", async () => {
    const innerRes = new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const inner = vi.fn(async () => innerRes);
    const wrapped = withPaywall(inner);
    const req = jsonRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res).toBe(innerRes);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards initialize to the inner handler", async () => {
    const inner = vi.fn(async () => new Response("{}", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards non-POST requests untouched", async () => {
    const inner = vi.fn(async () => new Response("ok", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = new Request("https://drwho.me/mcp/mcp", { method: "GET" });

    await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(inner).toHaveBeenCalledOnce();
  });

  it("forwards a non-JSON POST untouched (body peek fails gracefully)", async () => {
    const inner = vi.fn(async () => new Response("ok", { status: 200 }));
    const wrapped = withPaywall(inner);
    const req = new Request("https://drwho.me/mcp/mcp", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });

    expect(res.status).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("uses null for id when the request omits it (notification-shaped)", async () => {
    const inner = vi.fn();
    const wrapped = withPaywall(inner);
    const req = jsonRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "x", arguments: {} },
    });

    const res = await wrapped(req, { params: Promise.resolve({ transport: "mcp" }) });
    const body = await res.json();
    expect(body.id).toBeNull();
  });
});
```

- [ ] **Step 2.2: Run — fail**

```bash
pnpm test paywall
```

Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement `lib/mcp/paywall.ts`**

```ts
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ transport: string }> };
type RouteHandler = (req: NextRequest | Request, ctx: RouteContext) => Promise<Response>;

type JsonRpcEnvelope = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
};

const PAYWALL_MESSAGE =
  "This tool requires a drwho.me MCP subscription. Join the waitlist at https://drwho.me/mcp.";

const PAYWALL_DATA = {
  upgradeUrl: "https://drwho.me/mcp",
  tier: "paid",
} as const;

export function withPaywall(inner: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    if (req.method !== "POST") return inner(req, ctx);

    // Peek the body without consuming the stream the inner handler reads.
    let body: JsonRpcEnvelope | null = null;
    try {
      body = (await req.clone().json()) as JsonRpcEnvelope;
    } catch {
      return inner(req, ctx);
    }

    if (body?.method !== "tools/call") return inner(req, ctx);

    const id = body.id ?? null;
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32001,
          message: PAYWALL_MESSAGE,
          data: PAYWALL_DATA,
        },
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}
```

- [ ] **Step 2.4: Run — pass**

```bash
pnpm test paywall
```

Expected: 6 passing.

- [ ] **Step 2.5: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

All green.

- [ ] **Step 2.6: Commit**

```bash
git add lib/mcp/paywall.ts tests/unit/lib/mcp/paywall.test.ts
git commit -m "feat(mcp): withPaywall higher-order route wrapper (402 + JSON-RPC -32001)"
```

---

## Task 3: `lib/mcp/tools.ts` — MCP metadata registry

**Goal:** A typed array of MCP tool definitions keyed by slug. Each entry wires a tool's pure function (from `lib/tools/*`) to an MCP name, description, zod input schema, and handler. This is the only file that imports zod and the only place MCP-specific metadata lives. `content/tools.ts` later gets a narrow `mcpName?: string` pointer that references entries here.

**Files:**
- Create: `lib/mcp/tools.ts`
- Create: `tests/unit/lib/mcp/tools.test.ts`

**Tool coverage (exactly these 10 MCP tools, mapping to 8 `lib/tools/*` modules):**

| MCP name | Web slug | Pure function | Input | Output summary |
|---|---|---|---|---|
| `ip_lookup` | `ip-lookup` | `lookupIp(ip, token)` | `{ip: string}` | geolocation JSON |
| `dns_lookup` | `dns` | `resolveDns(name, type)` | `{name: string, type: enum}` | answers array |
| `user_agent_parse` | `user-agent` | `parseUserAgent(ua)` | `{ua: string}` | browser/os/device/engine |
| `json_format` | `json` | `formatJson(input, indent)` | `{input: string, indent?: 2\|4}` | formatted JSON or error |
| `base64_encode` | `base64` | `encodeBase64(input)` | `{input: string}` | base64 |
| `base64_decode` | `base64` | `decodeBase64(input)` | `{input: string}` | decoded UTF-8 |
| `url_encode` | `url-codec` | `encodeUrl(input)` | `{input: string}` | percent-encoded |
| `url_decode` | `url-codec` | `decodeUrl(input)` | `{input: string}` | decoded |
| `jwt_decode` | `jwt` | `decodeJwt(input)` | `{token: string}` | {header, payload, signature} |
| `uuid_generate` | `uuid` | `generateUuid(version)` | `{version: "v4"\|"v7"}` | UUID string |

`ip` and `headers` have no MCP tool — they're scoped to the browser's own request.

- [ ] **Step 3.1: Write the failing tests**

`tests/unit/lib/mcp/tools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mcpTools, findMcpTool } from "@/lib/mcp/tools";

describe("mcpTools", () => {
  it("exposes exactly the 10 MCP tools from the design spec", () => {
    const names = mcpTools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "base64_decode",
        "base64_encode",
        "dns_lookup",
        "ip_lookup",
        "json_format",
        "jwt_decode",
        "url_decode",
        "url_encode",
        "user_agent_parse",
        "uuid_generate",
      ].sort(),
    );
  });

  it("every tool name uses snake_case with no dashes", () => {
    for (const t of mcpTools) {
      expect(t.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("every tool has a non-empty description and an input schema", () => {
    for (const t of mcpTools) {
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.inputSchema).toBeDefined();
    }
  });

  it("every tool slug points at a real web tool slug (or null for mocked)", () => {
    const validSlugs = new Set([
      "ip-lookup",
      "dns",
      "user-agent",
      "json",
      "base64",
      "url-codec",
      "jwt",
      "uuid",
    ]);
    for (const t of mcpTools) {
      expect(validSlugs.has(t.slug)).toBe(true);
    }
  });

  it("uuid_generate handler returns a v4 UUID when asked", async () => {
    const tool = findMcpTool("uuid_generate");
    expect(tool).toBeDefined();
    const result = await tool!.handler({ version: "v4" });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("base64_encode handler encodes the input", async () => {
    const tool = findMcpTool("base64_encode");
    const result = await tool!.handler({ input: "hello" });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toBe("aGVsbG8=");
  });

  it("base64_decode handler returns an error-shaped result on invalid input", async () => {
    const tool = findMcpTool("base64_decode");
    const result = await tool!.handler({ input: "!!!not-base64!!!" });
    expect(result.isError).toBe(true);
  });

  it("json_format handler defaults indent to 2", async () => {
    const tool = findMcpTool("json_format");
    const result = await tool!.handler({ input: '{"a":1}' });
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    expect(text).toContain('  "a": 1');
  });

  it("findMcpTool returns undefined for unknown name", () => {
    expect(findMcpTool("does_not_exist")).toBeUndefined();
  });
});
```

- [ ] **Step 3.2: Run — fail**

```bash
pnpm test mcp/tools
```

Expected: FAIL — module not found.

- [ ] **Step 3.3: Implement `lib/mcp/tools.ts`**

```ts
import { z } from "zod";
import { decodeBase64, encodeBase64 } from "@/lib/tools/base64";
import { DNS_TYPES, resolveDns } from "@/lib/tools/dns";
import { lookupIp } from "@/lib/tools/ipLookup";
import { formatJson } from "@/lib/tools/json";
import { decodeJwt } from "@/lib/tools/jwt";
import { decodeUrl, encodeUrl } from "@/lib/tools/url";
import { parseUserAgent } from "@/lib/tools/userAgent";
import { generateUuid } from "@/lib/tools/uuid";

export type McpToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

// zod shapes expected by mcp-handler's server.tool() — raw object of zod types,
// NOT `z.object({...})`. See mcp-handler README.
export type McpTool = {
  name: string;
  description: string;
  slug: string; // pointer back to content/tools.ts
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (input: Record<string, unknown>) => Promise<McpToolResult>;
};

function ok(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function fail(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

export const mcpTools: McpTool[] = [
  {
    name: "ip_lookup",
    slug: "ip-lookup",
    description:
      "Look up an IP address (v4 or v6) and return its geolocation, ASN, and ISP via ipinfo.io.",
    inputSchema: {
      ip: z.string().describe("IPv4 or IPv6 address to look up"),
    },
    handler: async (input) => {
      const token = process.env.IPINFO_TOKEN ?? "";
      const ip = String((input as { ip?: string }).ip ?? "");
      const r = await lookupIp(ip, token);
      if (!r.ok) return fail(r.error);
      return ok(JSON.stringify(r.data, null, 2));
    },
  },
  {
    name: "dns_lookup",
    slug: "dns",
    description: "Resolve a DNS record (A, AAAA, MX, TXT, NS, CNAME) via Cloudflare DoH.",
    inputSchema: {
      name: z.string().describe("Domain name to resolve"),
      type: z.enum(DNS_TYPES).describe("DNS record type"),
    },
    handler: async (input) => {
      const { name, type } = input as { name: string; type: (typeof DNS_TYPES)[number] };
      const r = await resolveDns(name, type);
      if (!r.ok) return fail(r.error);
      return ok(JSON.stringify(r.answers, null, 2));
    },
  },
  {
    name: "user_agent_parse",
    slug: "user-agent",
    description: "Parse a User-Agent string into browser, OS, device, and engine components.",
    inputSchema: {
      ua: z.string().describe("User-Agent header value"),
    },
    handler: async (input) => {
      const ua = String((input as { ua?: string }).ua ?? "");
      return ok(JSON.stringify(parseUserAgent(ua), null, 2));
    },
  },
  {
    name: "json_format",
    slug: "json",
    description: "Format and validate JSON. Returns the pretty-printed string or a parse error.",
    inputSchema: {
      input: z.string().describe("Raw JSON text"),
      indent: z.union([z.literal(2), z.literal(4)]).optional().describe("Indent width; default 2"),
    },
    handler: async (input) => {
      const { input: raw, indent } = input as { input: string; indent?: 2 | 4 };
      const r = formatJson(raw, indent ?? 2);
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "base64_encode",
    slug: "base64",
    description: "Encode a UTF-8 string as standard base64.",
    inputSchema: {
      input: z.string().describe("UTF-8 string to encode"),
    },
    handler: async (input) => {
      const r = encodeBase64(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "base64_decode",
    slug: "base64",
    description: "Decode a base64 (or base64url) string to UTF-8.",
    inputSchema: {
      input: z.string().describe("Base64 or base64url string"),
    },
    handler: async (input) => {
      const r = decodeBase64(String((input as { input?: string }).input ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "url_encode",
    slug: "url-codec",
    description: "Percent-encode a string for use in a URL component.",
    inputSchema: {
      input: z.string().describe("String to encode"),
    },
    handler: async (input) => {
      const r = encodeUrl(String((input as { input?: string }).input ?? ""));
      return ok(r.value);
    },
  },
  {
    name: "url_decode",
    slug: "url-codec",
    description: "Decode a percent-encoded URL component.",
    inputSchema: {
      input: z.string().describe("Percent-encoded string"),
    },
    handler: async (input) => {
      const r = decodeUrl(String((input as { input?: string }).input ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(r.value);
    },
  },
  {
    name: "jwt_decode",
    slug: "jwt",
    description:
      "Decode a JWT into its header, payload, and signature parts. Does NOT verify the signature.",
    inputSchema: {
      token: z.string().describe("JWT compact serialization (three dot-separated segments)"),
    },
    handler: async (input) => {
      const r = decodeJwt(String((input as { token?: string }).token ?? ""));
      if (!r.ok) return fail(r.error);
      return ok(JSON.stringify({ header: r.header, payload: r.payload, signature: r.signature }, null, 2));
    },
  },
  {
    name: "uuid_generate",
    slug: "uuid",
    description: "Generate a v4 (random) or v7 (time-ordered) UUID.",
    inputSchema: {
      version: z.enum(["v4", "v7"]).describe("UUID version"),
    },
    handler: async (input) => {
      const version = (input as { version: "v4" | "v7" }).version;
      return ok(generateUuid(version));
    },
  },
];

export function findMcpTool(name: string): McpTool | undefined {
  return mcpTools.find((t) => t.name === name);
}
```

- [ ] **Step 3.4: Wire the pointer from `content/tools.ts`**

Open `content/tools.ts` and extend the `Tool` type + each entry. Leave `ip` and `headers` unchanged (they have no MCP equivalent).

Replace the `Tool` type:

```ts
export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  component: ComponentType;
  /**
   * MCP tool name(s) that map to this web tool. Undefined = not MCP-exposed.
   * Multiple entries for tools that expose >1 MCP function (e.g. base64 has encode + decode).
   */
  mcpNames?: readonly string[];
};
```

Update each `mcpNames` field per tool (insert inside each object; leave `ip` and `headers` untouched):

```ts
// base64
mcpNames: ["base64_encode", "base64_decode"],
// json
mcpNames: ["json_format"],
// url-codec
mcpNames: ["url_encode", "url_decode"],
// uuid
mcpNames: ["uuid_generate"],
// jwt
mcpNames: ["jwt_decode"],
// user-agent
mcpNames: ["user_agent_parse"],
// ip-lookup
mcpNames: ["ip_lookup"],
// dns
mcpNames: ["dns_lookup"],
```

> **Why `mcpNames: readonly string[]` and not a single `mcpName`?** Two tools (`base64`, `url-codec`) expose two MCP functions each. A `readonly string[]` captures that honestly without forcing a second registry entry or an awkward "primary name" convention.

- [ ] **Step 3.5: Run — pass**

```bash
pnpm test
```

Expected: existing suites still green + 9 new passing from `mcp/tools`.

- [ ] **Step 3.6: Verify nothing else broke**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

All green. In particular, the build should confirm zero new client-bundle weight for the home page route — `zod` is in `lib/mcp/tools.ts`, imported only by server-side code (route + landing page).

- [ ] **Step 3.7: Commit**

```bash
git add lib/mcp/tools.ts tests/unit/lib/mcp/tools.test.ts content/tools.ts
git commit -m "feat(mcp): MCP tool registry in lib/mcp/tools.ts; pointer from content/tools.ts"
```

---

## Task 4: `lib/mcp/server.ts` — register tools with mcp-handler

**Goal:** A tiny adapter that takes an mcp-handler `server` instance (passed to the `createMcpHandler` callback) and registers every entry from `lib/mcp/tools.ts`. Also exports a `capabilities` object that `createMcpHandler` wants in its second argument. Kept narrow so Task 5's route file is a one-liner.

**Files:**
- Create: `lib/mcp/server.ts`
- Create: `tests/unit/lib/mcp/server.test.ts`

- [ ] **Step 4.1: Write the failing tests**

`tests/unit/lib/mcp/server.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { mcpTools } from "@/lib/mcp/tools";
import { buildCapabilities, registerMcpTools } from "@/lib/mcp/server";

describe("registerMcpTools", () => {
  it("calls server.tool() once per MCP tool, with correct (name, description, schema, handler)", () => {
    const toolFn = vi.fn();
    const server = { tool: toolFn };
    registerMcpTools(server);

    expect(toolFn).toHaveBeenCalledTimes(mcpTools.length);
    for (const t of mcpTools) {
      expect(toolFn).toHaveBeenCalledWith(t.name, t.description, t.inputSchema, expect.any(Function));
    }
  });

  it("the handler passed through is the MCP tool's handler", async () => {
    const captured: Record<string, (i: unknown) => unknown> = {};
    const server = {
      tool: (name: string, _d: string, _s: unknown, h: (i: unknown) => unknown) => {
        captured[name] = h;
      },
    };
    registerMcpTools(server);

    const uuid = await (captured.uuid_generate as (i: { version: "v4" }) => Promise<{ content: [{ text: string }] }>)({ version: "v4" });
    expect(uuid.content[0].text).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("buildCapabilities", () => {
  it("emits a tools entry with every MCP tool's description", () => {
    const caps = buildCapabilities();
    expect(caps.tools).toBeDefined();
    for (const t of mcpTools) {
      expect(caps.tools[t.name]).toEqual({ description: t.description });
    }
  });
});
```

- [ ] **Step 4.2: Run — fail**

```bash
pnpm test mcp/server
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement `lib/mcp/server.ts`**

```ts
import type { z } from "zod";
import { mcpTools } from "@/lib/mcp/tools";

// Minimal structural type for the mcp-handler `server` object. We only call `tool`.
// Using a structural type keeps this file trivially testable (no SDK instance required).
type McpServerLike = {
  tool: (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (input: Record<string, unknown>) => unknown,
  ) => void;
};

export function registerMcpTools(server: McpServerLike): void {
  for (const t of mcpTools) {
    server.tool(t.name, t.description, t.inputSchema, t.handler);
  }
}

export type McpCapabilities = {
  tools: Record<string, { description: string }>;
};

export function buildCapabilities(): McpCapabilities {
  const tools: McpCapabilities["tools"] = {};
  for (const t of mcpTools) tools[t.name] = { description: t.description };
  return { tools };
}
```

- [ ] **Step 4.4: Run — pass**

```bash
pnpm test mcp/server
```

Expected: 3 passing.

- [ ] **Step 4.5: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

All green.

- [ ] **Step 4.6: Commit**

```bash
git add lib/mcp/server.ts tests/unit/lib/mcp/server.test.ts
git commit -m "feat(mcp): registerMcpTools + capabilities builder"
```

---

## Task 5: `app/mcp/[transport]/route.ts` — the MCP route handler

**Goal:** Mount `mcp-handler` at `app/mcp/[transport]/route.ts` with `basePath: "/mcp"`, pass the registration fn from `lib/mcp/server.ts`, wrap the whole thing in `withPaywall`, and export `GET`/`POST`/`DELETE`. URL clients will use: `https://drwho.me/mcp/mcp`.

**Files:**
- Create: `app/mcp/[transport]/route.ts`

- [ ] **Step 5.1: Create the route**

```ts
import { createMcpHandler } from "mcp-handler";
import { buildCapabilities, registerMcpTools } from "@/lib/mcp/server";
import { withPaywall } from "@/lib/mcp/paywall";

const inner = createMcpHandler(
  (server) => {
    registerMcpTools(server);
  },
  {
    serverInfo: { name: "drwho.me", version: "0.1.0" },
    capabilities: buildCapabilities(),
  },
  {
    basePath: "/mcp",
    verboseLogs: false,
    maxDuration: 60,
  },
);

const handler = withPaywall(inner);

export { handler as GET, handler as POST, handler as DELETE };
```

- [ ] **Step 5.2: Smoke-build**

```bash
rm -rf .next
pnpm lint && pnpm typecheck && pnpm build
```

Expected: build succeeds. Build output lists `/mcp/[transport]` as a Node-runtime route (`ƒ` — dynamic / server).

- [ ] **Step 5.3: Smoke-run and curl**

In one terminal:

```bash
pnpm start
```

In another:

```bash
# initialize — expect 200 + JSON-RPC result
curl -s -X POST http://localhost:3000/mcp/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  | head -c 400 ; echo

# tools/list — expect 10 tools
curl -s -X POST http://localhost:3000/mcp/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | head -c 800 ; echo

# tools/call — expect 402 + error code -32001
curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:3000/mcp/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"uuid_generate","arguments":{"version":"v4"}}}'
```

Expected:
- `initialize` → `{"jsonrpc":"2.0","id":1,"result":{...}}` with 200
- `tools/list` → `result.tools` array length 10
- `tools/call` → HTTP 402, body has `error.code: -32001` and `error.data.upgradeUrl`

If `initialize` returns an SSE stream instead of JSON (mcp-handler may negotiate based on `Accept`), the curl command shows the `data: ...` SSE frame — treat this as correct behavior (the Streamable HTTP spec permits both). The critical assertion is that the body parses as a valid JSON-RPC response or SSE frame containing one.

Kill the server when done.

- [ ] **Step 5.4: Commit**

```bash
git add app/mcp/[transport]/route.ts
git commit -m "feat(mcp): /mcp/[transport] route handler with paywall"
```

---

## Task 6: E2E tests for the MCP endpoint

**Goal:** Playwright asserts the three JSON-RPC flows against a real running server — the same flows curl exercised manually in Task 5.

**Files:**
- Create: `tests/e2e/mcp.spec.ts`

- [ ] **Step 6.1: Write the E2E**

`tests/e2e/mcp.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const MCP_URL = "/mcp/mcp";
const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
};

function parseMaybeSse(raw: string): unknown {
  // mcp-handler may respond with an SSE frame like "event: message\ndata: {...}\n\n"
  // Pull out the first JSON object either way.
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const match = trimmed.match(/data:\s*(\{[\s\S]*?\})\s*$/m);
  if (!match) throw new Error(`unparseable MCP body: ${raw.slice(0, 120)}`);
  return JSON.parse(match[1]);
}

test("MCP initialize returns server capabilities", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "playwright", version: "0" },
      },
    },
  });
  expect(res.status()).toBe(200);
  const body = parseMaybeSse(await res.text()) as {
    result: { serverInfo: { name: string }; capabilities: { tools?: unknown } };
  };
  expect(body.result.serverInfo.name).toBe("drwho.me");
  expect(body.result.capabilities.tools).toBeDefined();
});

test("MCP tools/list advertises every MCP-compatible tool", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: { jsonrpc: "2.0", id: 2, method: "tools/list" },
  });
  expect(res.status()).toBe(200);
  const body = parseMaybeSse(await res.text()) as {
    result: { tools: { name: string }[] };
  };
  const names = body.result.tools.map((t) => t.name).sort();
  expect(names).toEqual(
    [
      "base64_decode",
      "base64_encode",
      "dns_lookup",
      "ip_lookup",
      "json_format",
      "jwt_decode",
      "url_decode",
      "url_encode",
      "user_agent_parse",
      "uuid_generate",
    ].sort(),
  );
});

test("MCP tools/call returns 402 + -32001 paywall", async ({ request }) => {
  const res = await request.post(MCP_URL, {
    headers: HEADERS,
    data: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "uuid_generate", arguments: { version: "v4" } },
    },
  });
  expect(res.status()).toBe(402);
  const body = (await res.json()) as {
    error: { code: number; message: string; data: { upgradeUrl: string; tier: string } };
  };
  expect(body.error.code).toBe(-32001);
  expect(body.error.message).toMatch(/subscription/i);
  expect(body.error.data.upgradeUrl).toBe("https://drwho.me/mcp");
  expect(body.error.data.tier).toBe("paid");
});

test("MCP tools/call paywalls every MCP-compatible tool (quick spot check)", async ({ request }) => {
  for (const name of ["jwt_decode", "base64_encode", "dns_lookup"]) {
    const res = await request.post(MCP_URL, {
      headers: HEADERS,
      data: {
        jsonrpc: "2.0",
        id: 10,
        method: "tools/call",
        params: { name, arguments: {} },
      },
    });
    expect(res.status(), `expected 402 for ${name}`).toBe(402);
  }
});
```

- [ ] **Step 6.2: Run E2E**

```bash
# Defensive kill of any stale next start (prior cmemory lesson)
pkill -f "next start" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -rf .next

pnpm test:e2e tests/e2e/mcp.spec.ts
```

Expected: 4 passing.

- [ ] **Step 6.3: Run the full E2E suite to confirm no regression**

```bash
pnpm test:e2e
```

Expected: all prior E2E tests still pass, plus 4 new MCP tests. Total ≥ 22.

- [ ] **Step 6.4: Commit**

```bash
git add tests/e2e/mcp.spec.ts
git commit -m "test(e2e): MCP endpoint — initialize, tools/list, paywall on tools/call"
```

---

## Task 7: `lib/waitlist.ts` — pure validation + record shaping

**Goal:** A pure function `validateWaitlistInput(raw)` that checks email shape, honeypot emptiness, and notes length, returning either `{ok: true, record}` or `{ok: false, error}`. The returned record has the exact shape written to KV. No I/O here — the server action in Task 8 handles persistence.

**Files:**
- Create: `lib/waitlist.ts`
- Create: `tests/unit/lib/waitlist.test.ts`

- [ ] **Step 7.1: Write the failing tests**

`tests/unit/lib/waitlist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateWaitlistInput } from "@/lib/waitlist";

describe("validateWaitlistInput", () => {
  it("accepts a valid submission with notes", () => {
    const r = validateWaitlistInput({
      email: "dev@example.com",
      notes: "would pay for higher rate limits",
      honeypot: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.record.email).toBe("dev@example.com");
      expect(r.record.notes).toBe("would pay for higher rate limits");
      expect(r.record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("accepts a valid submission without notes (notes optional)", () => {
    const r = validateWaitlistInput({ email: "dev@example.com", notes: "", honeypot: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.record.notes).toBe("");
  });

  it("trims surrounding whitespace on email", () => {
    const r = validateWaitlistInput({ email: "  a@b.co  ", notes: "", honeypot: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.record.email).toBe("a@b.co");
  });

  it("rejects when email is missing", () => {
    const r = validateWaitlistInput({ email: "", notes: "", honeypot: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when email is not syntactically an email", () => {
    const r = validateWaitlistInput({ email: "not-an-email", notes: "", honeypot: "" });
    expect(r.ok).toBe(false);
  });

  it("rejects when the honeypot field is non-empty (likely bot)", () => {
    const r = validateWaitlistInput({ email: "a@b.co", notes: "hi", honeypot: "gotcha" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/honeypot|spam|bot/i);
  });

  it("rejects notes longer than 500 chars", () => {
    const r = validateWaitlistInput({
      email: "a@b.co",
      notes: "x".repeat(501),
      honeypot: "",
    });
    expect(r.ok).toBe(false);
  });

  it("allows notes up to 500 chars", () => {
    const r = validateWaitlistInput({
      email: "a@b.co",
      notes: "x".repeat(500),
      honeypot: "",
    });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 7.2: Run — fail**

```bash
pnpm test waitlist
```

Expected: FAIL — module not found.

- [ ] **Step 7.3: Implement `lib/waitlist.ts`**

```ts
export type WaitlistRecord = {
  email: string;
  notes: string;
  createdAt: string; // ISO 8601
};

export type WaitlistInput = {
  email: string;
  notes: string;
  honeypot: string; // hidden form field; real users leave empty
};

export type ValidationResult =
  | { ok: true; record: WaitlistRecord }
  | { ok: false; error: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_NOTES_LENGTH = 500;

export function validateWaitlistInput(input: WaitlistInput): ValidationResult {
  if (input.honeypot.trim() !== "") {
    return { ok: false, error: "honeypot tripped" };
  }
  const email = input.email.trim();
  if (!email) return { ok: false, error: "email required" };
  if (!EMAIL.test(email)) return { ok: false, error: "invalid email" };
  const notes = input.notes ?? "";
  if (notes.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: `notes must be ${MAX_NOTES_LENGTH} characters or fewer` };
  }
  return {
    ok: true,
    record: { email, notes, createdAt: new Date().toISOString() },
  };
}
```

- [ ] **Step 7.4: Run — pass**

```bash
pnpm test waitlist
```

Expected: 8 passing.

- [ ] **Step 7.5: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

All green.

- [ ] **Step 7.6: Commit**

```bash
git add lib/waitlist.ts tests/unit/lib/waitlist.test.ts
git commit -m "feat(waitlist): pure validateWaitlistInput helper"
```

---

## Task 8: `app/mcp/actions.ts` — server action (KV + Resend)

**Goal:** A Next.js server action that takes a `FormData`, runs `validateWaitlistInput`, persists the record to Vercel KV list `waitlist:mcp`, and sends a Resend notification to `CONTACT_TO_EMAIL`. Fails gracefully (`{ok:false, error:"waitlist temporarily unavailable"}`) if env vars are missing — matches the existing contact-form pattern in `app/contact/actions.ts`.

**Files:**
- Create: `app/mcp/actions.ts`
- Create: `tests/unit/app/mcp/actions.test.ts`

- [ ] **Step 8.1: Implement `app/mcp/actions.ts`**

```ts
"use server";

import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { validateWaitlistInput } from "@/lib/waitlist";

export type WaitlistActionResult = { ok: true } | { ok: false; error: string };

export async function joinWaitlist(formData: FormData): Promise<WaitlistActionResult> {
  const input = {
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    honeypot: String(formData.get("company") ?? ""),
  };

  const v = validateWaitlistInput(input);
  if (!v.ok) return { ok: false, error: v.error };

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { ok: false, error: "waitlist temporarily unavailable" };
  }

  try {
    await kv.lpush("waitlist:mcp", JSON.stringify(v.record));
  } catch {
    return { ok: false, error: "waitlist temporarily unavailable" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (apiKey && to) {
    const resend = new Resend(apiKey);
    // Fire-and-forget; a delivery failure shouldn't invalidate a stored signup.
    await resend.emails
      .send({
        from: "drwho.me <noreply@drwho.me>",
        to,
        subject: `[drwho.me waitlist] ${v.record.email}`,
        text: `Email: ${v.record.email}\nNotes: ${v.record.notes || "(none)"}\nAt: ${v.record.createdAt}`,
      })
      .catch(() => undefined);
  }

  return { ok: true };
}
```

- [ ] **Step 8.2: Write the server-action unit test**

The action is I/O orchestration — we already unit-tested the validator in Task 7. This test pins the *wiring*: on valid input, KV is called with the right payload; on invalid input, KV is not called; on missing env, we return graceful-degradation; on KV failure, we also return graceful-degradation. Mocks use `vi.mock` with the module path so Vitest intercepts `@vercel/kv` and `resend` imports.

`tests/unit/app/mcp/actions.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const kvLpush = vi.fn();
const resendSend = vi.fn();

vi.mock("@vercel/kv", () => ({
  kv: { lpush: (...args: unknown[]) => kvLpush(...args) },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => resendSend(...args) },
  })),
}));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("joinWaitlist", () => {
  beforeEach(() => {
    kvLpush.mockReset();
    resendSend.mockReset();
    kvLpush.mockResolvedValue(1);
    resendSend.mockResolvedValue({ error: null });
    process.env.KV_REST_API_URL = "https://kv.example.com";
    process.env.KV_REST_API_TOKEN = "token";
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_TO_EMAIL = "waitlist@drwho.me";
  });

  afterEach(() => {
    process.env.KV_REST_API_URL = undefined;
    process.env.KV_REST_API_TOKEN = undefined;
    process.env.RESEND_API_KEY = undefined;
    process.env.CONTACT_TO_EMAIL = undefined;
  });

  it("stores a valid record in KV list waitlist:mcp and emails the inbox", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "rate limits", company: "" }));
    expect(res).toEqual({ ok: true });
    expect(kvLpush).toHaveBeenCalledOnce();
    expect(kvLpush).toHaveBeenCalledWith("waitlist:mcp", expect.stringContaining('"a@b.co"'));
    expect(resendSend).toHaveBeenCalledOnce();
    const emailArgs = resendSend.mock.calls[0][0] as { to: string; subject: string; text: string };
    expect(emailArgs.to).toBe("waitlist@drwho.me");
    expect(emailArgs.subject).toContain("a@b.co");
    expect(emailArgs.text).toContain("rate limits");
  });

  it("rejects invalid email without touching KV or Resend", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "not-email", notes: "", company: "" }));
    expect(res.ok).toBe(false);
    expect(kvLpush).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
  });

  it("rejects when honeypot is filled without touching KV or Resend", async () => {
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "bot" }));
    expect(res.ok).toBe(false);
    expect(kvLpush).not.toHaveBeenCalled();
  });

  it("returns 'temporarily unavailable' when KV env vars are missing", async () => {
    process.env.KV_REST_API_URL = undefined;
    process.env.KV_REST_API_TOKEN = undefined;
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: false, error: "waitlist temporarily unavailable" });
    expect(kvLpush).not.toHaveBeenCalled();
  });

  it("returns 'temporarily unavailable' when KV throws", async () => {
    kvLpush.mockRejectedValueOnce(new Error("boom"));
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: false, error: "waitlist temporarily unavailable" });
  });

  it("still returns ok when Resend fails (record is stored; email is best-effort)", async () => {
    resendSend.mockRejectedValueOnce(new Error("smtp fail"));
    const { joinWaitlist } = await import("@/app/mcp/actions");
    const res = await joinWaitlist(formData({ email: "a@b.co", notes: "", company: "" }));
    expect(res).toEqual({ ok: true });
    expect(kvLpush).toHaveBeenCalledOnce();
  });
});
```

> **"use server" + Vitest**: server-action files compile fine under Vitest as long as you import them dynamically inside tests (as above) — Vitest's jsdom env doesn't choke on the `"use server"` directive, it's just a no-op string. Top-level `import` would work too, but dynamic `await import` gives us per-test env-var state without Vitest caching the module.

- [ ] **Step 8.3: Run — pass**

```bash
pnpm test actions
```

Expected: 6 passing.

- [ ] **Step 8.4: Verify**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All green.

- [ ] **Step 8.5: Commit**

```bash
git add app/mcp/actions.ts tests/unit/app/mcp/actions.test.ts
git commit -m "feat(mcp): waitlist server action (Vercel KV + Resend) with tests"
```

---

## Task 9: `/mcp` landing page + Nav/Footer links

**Goal:** A server component at `app/mcp/page.tsx` that reads `mcpTools` from `lib/mcp/tools.ts` and renders (a) the copyable Claude Desktop / ChatGPT config pointing at `https://drwho.me/mcp/mcp`, (b) the tool list, (c) a waitlist form (client component, wired to Task 8's action). Nav + Footer get a `/mcp` link.

**Files:**
- Create: `app/mcp/page.tsx`
- Create: `app/mcp/WaitlistForm.tsx`
- Modify: `components/layout/Nav.tsx`

- [ ] **Step 9.1: Write the client form**

`app/mcp/WaitlistForm.tsx`:

```tsx
"use client";

import { TerminalCard } from "@/components/terminal/TerminalCard";
import { useState } from "react";
import { joinWaitlist } from "./actions";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const res = await joinWaitlist(new FormData(e.currentTarget));
    if (res.ok) {
      setStatus("ok");
      e.currentTarget.reset();
    } else {
      setErr(res.error);
      setStatus("err");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm" aria-label="waitlist">
      <label className="block">
        email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border bg-bg p-2"
        />
      </label>
      <label className="block">
        what would you use this for? <span className="text-muted">(optional)</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          className="block w-full mt-1 border bg-bg p-2"
        />
      </label>
      {/* Honeypot — hidden from humans, left empty. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" disabled={status === "sending"} className="border px-3 py-1">
        {status === "sending" ? "joining..." : "join waitlist"}
      </button>
      {status === "ok" && <TerminalCard label="status">you&apos;re on the list. we&apos;ll be in touch.</TerminalCard>}
      {status === "err" && <TerminalCard label="error">{err}</TerminalCard>}
    </form>
  );
}
```

- [ ] **Step 9.2: Write the landing page**

`app/mcp/page.tsx`:

```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { TerminalPrompt } from "@/components/terminal/TerminalPrompt";
import { findTool } from "@/content/tools";
import { mcpTools } from "@/lib/mcp/tools";
import { pageMetadata, siteUrl } from "@/lib/seo";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = pageMetadata({
  title: "mcp endpoint",
  description:
    "Remote MCP endpoint for drwho.me. Point Claude Desktop or any MCP client at https://drwho.me/mcp/mcp. Paid tier coming soon — join the waitlist.",
  path: "/mcp",
  type: "page",
});

const MCP_URL = "https://drwho.me/mcp/mcp";

const claudeConfig = JSON.stringify(
  {
    mcpServers: {
      "drwho.me": {
        url: MCP_URL,
      },
    },
  },
  null,
  2,
);

export default function McpLanding() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "drwho.me MCP endpoint",
    description:
      "Remote MCP server at drwho.me. Streamable HTTP transport. Paid tier — join the waitlist.",
    url: `${siteUrl()}/mcp`,
  };

  return (
    <article className="space-y-6">
      <Breadcrumb path="~/mcp" />
      <TerminalPrompt>mcp</TerminalPrompt>
      <p className="text-sm">
        <span className="text-muted">drwho.me</span> exposes a remote MCP endpoint so AI clients
        like Claude Desktop and ChatGPT can call the same tools this site offers in the browser.
        The endpoint is <span className="text-muted">paid</span>: the handshake and tool listing are
        open so your client can discover what&apos;s available, but every <code>tools/call</code>{" "}
        returns a <code>402</code> + MCP error pointing back here. Join the waitlist below — we
        ping you when the paid tier opens.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">endpoint</h2>
        <TerminalCard label="$ url">{MCP_URL}</TerminalCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">claude desktop config</h2>
        <TerminalCard label="$ claude_desktop_config.json">
          <pre className="text-xs whitespace-pre overflow-x-auto">{claudeConfig}</pre>
        </TerminalCard>
        <p className="text-xs text-muted">
          Add this to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
          (macOS) or the equivalent on Linux/Windows, then restart Claude Desktop.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">tools advertised ({mcpTools.length})</h2>
        <ul className="text-sm space-y-1 list-none p-0">
          {mcpTools.map((t) => {
            const web = findTool(t.slug);
            return (
              <li key={t.name} className="border-b last:border-b-0 py-2">
                <code className="text-accent">{t.name}</code> — {t.description}
                {web && (
                  <>
                    {" "}
                    <Link
                      href={`/tools/${web.slug}` as Route}
                      className="text-muted"
                    >
                      (try in browser)
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-muted">waitlist</h2>
        <p className="text-sm">
          drop your email and we&apos;ll tell you when paid access opens. no other uses.
        </p>
        <WaitlistForm />
      </section>

      <JsonLd data={jsonLd} />
    </article>
  );
}
```

- [ ] **Step 9.3: Add `/mcp` to Nav**

Modify `components/layout/Nav.tsx`. Add a link to `/mcp` between `/blog` and `/about`:

```tsx
import { ThemeToggle } from "@/components/terminal/ThemeToggle";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="w-full max-w-content mx-auto px-4 py-3 flex items-center justify-between border-b">
      <Link href="/" className="no-underline text-fg">
        drwho
        <span className="cursor" />
      </Link>
      <div className="flex items-center gap-4 text-xs">
        <Link href="/#tools">tools</Link>
        <Link href="/blog">blog</Link>
        <Link href="/mcp">mcp</Link>
        <Link href="/about">about</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
```

> **Prior lesson bb6d1154:** `typedRoutes: true` validates every `<Link href>` against a real route. Steps 9.2 (creating `app/mcp/page.tsx`) and 9.3 (Nav link to `/mcp`) **must ship in the same commit** — otherwise `pnpm typecheck` fails the build.

- [ ] **Step 9.4: Verify build + smoke**

```bash
rm -rf .next
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: `/mcp` appears in the build output as SSG or dynamic server route. `sitemap.ts` (Plan 3) does NOT currently list `/mcp` — that's intentional for Plan 4. The landing page is discovered by Nav; adding it to the sitemap is Plan 5/6 territory once real MCP traffic matters.

- [ ] **Step 9.5: Manual smoke (optional but recommended)**

```bash
pnpm start
# In another terminal:
open http://localhost:3000/mcp
```

Visually verify:
- Nav shows `mcp` link active on the page.
- Endpoint URL renders in a `TerminalCard`.
- Tool list shows 10 entries.
- Waitlist form renders with email + notes + submit button.
- Submit with an empty email → browser's HTML5 validation blocks it (`required`).
- Submit with `test@example.com` → if KV is attached to the local env the form shows "you're on the list". If env vars are missing, it shows "waitlist temporarily unavailable" — this is the expected graceful-degradation path for local dev without KV.

Kill the server when done.

- [ ] **Step 9.6: Append the E2E form test**

Append to `tests/e2e/mcp.spec.ts`:

```ts
test("/mcp landing renders endpoint URL + tool list + waitlist form", async ({ page }) => {
  await page.goto("/mcp");
  await expect(page.getByText("https://drwho.me/mcp/mcp")).toBeVisible();
  await expect(page.getByText("uuid_generate")).toBeVisible();
  await expect(page.locator('form[aria-label="waitlist"]')).toBeVisible();
});

test("/mcp waitlist form rejects obviously invalid input", async ({ page }) => {
  await page.goto("/mcp");
  // HTML5 required blocks empty; type an invalid email and submit.
  await page.fill('input[name="email"]', "not-an-email");
  // HTML5 email validation triggers the browser's native invalid state; skip to
  // submission via form.requestSubmit() to bypass the native validation UI.
  const submitResult = await page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>('form[aria-label="waitlist"]');
    if (!form) return "no-form";
    return form.checkValidity() ? "valid" : "invalid";
  });
  expect(submitResult).toBe("invalid");
});
```

Run:

```bash
pkill -f "next start" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -rf .next
pnpm test:e2e tests/e2e/mcp.spec.ts
```

Expected: 6 passing (4 existing + 2 new).

- [ ] **Step 9.7: Commit**

```bash
git add app/mcp/page.tsx app/mcp/WaitlistForm.tsx components/layout/Nav.tsx tests/e2e/mcp.spec.ts
git commit -m "feat(mcp): /mcp landing page, waitlist form, nav link"
```

---

## Task 10: README env vars + final full gate + tag

**Goal:** Document the new env vars and verify the complete gate: lint, typecheck, unit tests, build, E2E, Lighthouse. Tag the plan complete.

**Files:**
- Modify: `README.md`

- [ ] **Step 10.1: Update `README.md` env-var table**

Replace the env-var table in `README.md` with:

```md
| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | contact + waitlist email delivery |
| `CONTACT_TO_EMAIL` | inbox that receives contact + waitlist messages |
| `NEXT_PUBLIC_SITE_URL` | canonical site origin, e.g. `https://drwho.me` |
| `IPINFO_TOKEN` | ipinfo.io API token |
| `KV_REST_API_URL` | Vercel KV REST endpoint (auto-set when KV is attached) |
| `KV_REST_API_TOKEN` | Vercel KV REST auth token (auto-set when KV is attached) |
| `NEXT_PUBLIC_ADS_ENABLED` | `"true"` to load real AdSense (Plan 5) |
| `ADSENSE_CLIENT_ID` | AdSense client id (Plan 5) |
```

Also add a one-line `## MCP` section below the `## Dev` section:

```md
## MCP

A remote MCP endpoint lives at `/mcp/mcp` (Streamable HTTP). The handshake and tool listing are open; `tools/call` is paywalled (HTTP 402, JSON-RPC error -32001) until the paid tier opens. See `/mcp` on the site for config snippets and the waitlist.
```

- [ ] **Step 10.2: Full gate**

```bash
cd /Users/arshad/Workspace/hikmah/drwho
pkill -f "next start" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -rf .next
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm lh
```

All must pass. Specific expectations:
- `pnpm test`: all prior suites + 32+ new unit tests from Plan 4 (paywall 6 + tools 9 + server 3 + waitlist 8 + actions 6).
- `pnpm build`: lists `/mcp`, `/mcp/[transport]`, plus all prior routes.
- `pnpm test:e2e`: all prior tests + 6 new from `tests/e2e/mcp.spec.ts`.
- `pnpm lh`: Lighthouse config doesn't yet probe `/mcp`; it still gates the 6 URLs from Plan 3. Scores should be unaffected.

If anything fails, fix it. Never weaken an assertion to get a green — if a test is wrong, the code is wrong, or the test is wrong and deserves rewriting, not deletion.

- [ ] **Step 10.3: Commit + tag**

```bash
git add README.md
git commit -m "docs: MCP endpoint + waitlist env vars"
git tag -a plan-4-complete -m "drwho.me MCP endpoint + paywall stub + waitlist complete"
```

---

## Done when

- `app/mcp/[transport]/route.ts` mounted, accepting JSON-RPC POST + GET at `/mcp/mcp`.
- `initialize` + `tools/list` pass through; `tools/list` advertises exactly 10 MCP tools matching the design spec.
- `tools/call` returns HTTP 402 + `{jsonrpc:"2.0", id, error:{code:-32001, message, data:{upgradeUrl, tier:"paid"}}}` for every tool.
- `lib/mcp/paywall.ts` is the single place the paywall logic lives — Plan 6 swaps it wholesale.
- Tool handlers in `lib/mcp/tools.ts` re-use the pure functions from `lib/tools/*` — zero logic duplication.
- `content/tools.ts` gains only an optional `mcpNames?: readonly string[]` pointer; zod stays out of the client bundle.
- `/mcp` landing page renders the endpoint URL, a copyable Claude Desktop config, the 10-tool list, and a waitlist form.
- Waitlist form writes to Vercel KV list `waitlist:mcp` and sends a Resend notification to `CONTACT_TO_EMAIL`.
- Honeypot + email-format validation + 500-char notes cap in `lib/waitlist.ts`, fully unit-tested.
- Nav links to `/mcp`.
- 32+ new unit tests + 6 new E2E tests, all green.
- Full gate (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && pnpm lh`) passes.
- Tag `plan-4-complete`.

## Next

**Plan 5** (monetization): AdSense script wiring + non-personalized → personalized consent banner (if enabled) + affiliate activation on `/tools/ip`, `/tools/ip-lookup`, `/tools/dns`, `/tools/jwt`.

**Plan 6** (paid MCP tier): Stripe subscription + API key issuance + `withPaywall` → `withStripeBilling` swap + per-call metering + waitlist-to-onboarding conversion.
