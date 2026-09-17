import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type McpTool, mcpTools } from "./tools";

export const SERVER_INFO = { name: "drwho.me", version: "2.0.0" } as const;

/** Builds a server with every tool registered. `wrap` lets the HTTP endpoint add metering. */
export function createMcpServer(
  wrap: (tool: McpTool) => McpTool["handler"] = (t) => t.handler,
): McpServer {
  const server = new McpServer(SERVER_INFO, {
    instructions:
      "Free network, email-authentication and developer tools from drwho.me. Start with dossier_summary for a domain overview, then call a single dossier_* tool for raw data. Each domain result links to the full graded report on Domain Posture.",
  });
  for (const tool of mcpTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        // Every tool only reads public data or transforms its input.
        annotations: {
          readOnlyHint: true,
          openWorldHint: tool.description.includes("Runs locally") === false,
        },
      },
      (input) => wrap(tool)(input as Record<string, unknown>),
    );
  }
  return server;
}
