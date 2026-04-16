import { withPaywall } from "@/lib/mcp/paywall";
import { registerMcpTools } from "@/lib/mcp/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "mcp-handler";

// McpServerLike in server.ts uses a structural approximation of McpServer.tool.
// The real McpServer satisfies the same 4-arg call; cast to resolve the overload mismatch.
function initServer(server: McpServer): void {
  registerMcpTools(server as Parameters<typeof registerMcpTools>[0]);
}

// createMcpHandler returns (request: Request) => Promise<Response>.
// withPaywall expects (req, ctx) => Promise<Response> matching Next.js route shape.
// We lift the inner handler into that signature here.
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

export { handler as GET, handler as POST, handler as DELETE };
