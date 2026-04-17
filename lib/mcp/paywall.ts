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
    if (process.env.MCP_PAYWALL_ENABLED === "false") return inner(req, ctx);
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
