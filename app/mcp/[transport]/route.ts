import { withPaywall } from "@/lib/mcp/paywall";
import { registerMcpTools } from "@/lib/mcp/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "mcp-handler";

// registerMcpTools expects a minimal structural `{tool: ...}` object (McpServerLike)
// so it can be unit-tested without the SDK. The SDK's `McpServer.tool` is heavily
// overloaded, which TypeScript doesn't consider structurally assignable to our
// single-signature McpServerLike. Construct an explicit adapter instead of casting.
function initServer(server: McpServer): void {
  registerMcpTools({
    tool: (name, description, schema, handler) =>
      // Cast handler to the SDK's expected callback signature, which is wider than our simple one.
      // biome-ignore lint/suspicious/noExplicitAny: SDK's tool() has 6 overloads; our adapter is intentionally minimal.
      server.tool(name, description, schema, handler as any),
  });
}

// `ctx.params` (from Next.js dynamic routes) is intentionally dropped:
// mcp-handler derives the transport from `basePath` + request URL, not from
// Next.js route params, and `createMcpHandler` returns a single-arg `(req) => Response`.
const mcpInner = createMcpHandler(
  initServer,
  {
    serverInfo: { name: "drwho.me", version: "0.1.0" },
    capabilities: { tools: {} },
  },
  {
    basePath: "/mcp",
    verboseLogs: false,
    maxDuration: 60,
  },
);

const handler = withPaywall((req, _ctx) => mcpInner(req));

// HEAD requests come from link-preview bots and uptime monitors. Next.js falls
// back to GET when HEAD isn't exported, which enters mcp-handler's SSE path and
// hangs until the 60s serverless timeout — producing a 504. Short-circuit fast.
export function HEAD(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-MCP-Server": "drwho.me",
      "X-MCP-Transport": "streamable-http",
      "Cache-Control": "no-store",
    },
  });
}

export { handler as GET, handler as POST, handler as DELETE };
